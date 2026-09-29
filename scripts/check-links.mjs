#!/usr/bin/env node
/**
 * 工具链接健康检查
 *
 * 逐个探测 src/data/site-data.json 中所有工具的 URL 可达性，结果分 6 类：
 *
 *   ok          2xx，可注册域名未变                  -> status=active
 *   wall        跳转或登录墙，**刻意不改写 url**      -> status=active
 *   moved       2xx，可注册域名变了且是 301/308 永久  -> status=active + 更新 url + note
 *   dnserror    域名解析失败（域名已不存在）           -> status=broken + note
 *   httperror   4xx / 5xx                          -> **不写回**，仅报告
 *   unreachable 超时 / 连接失败 / TLS 失败           -> **不写回**，仅报告
 *
 * 默认 **dry-run**：只输出报告，不改动任何文件；加 --write 才写回 JSON。
 *
 * ---------------------------------------------------------------------------
 * 四条刻意保守的规则，全部来自实测踩坑（详见 docs/designs/2026-09-29-single-page-grid/）
 * ---------------------------------------------------------------------------
 *
 * 1. **只有 DNS 解析失败才判定「失效」**
 *    本机可访问 ≠ 站点可用：ChatGPT、视觉中国、图虫、腾讯智影 等从本机一律连不上
 *    （网络出口限制所致）但工具本身有效。若把超时也算失效，会一次标脏几十个好工具。
 *    故超时 / 连接失败 / 4xx / 5xx 一律只报告，交人工判断。
 *
 * 2. **HEAD 极不可靠，必须用 GET 复测**
 *    实测抖音、小红书、巨量云图对 HEAD 一律返回 404、GET 才 200。
 *    因此 HEAD 只要不是 2xx 就退回 GET 重测。
 *
 * 3. **登录墙 / 错误页不算迁移**
 *    后台类入口（拼多多商家后台、京东商家后台、生意参谋）会被重定向到 login/passport，
 *    其地址带一次性 token，回写会破坏原始入口。最终地址命中登录/错误特征时一律不改 url。
 *
 * 4. **只有 301/308 永久跳转才算域名迁移**
 *    302/307 往往是地域分站、A/B 或临时跳转：实测 www.17zwd.com 会跳到 cs.17zwd.com
 *    （潮汕分站，随访问地变化），把通用入口写成某个分站就错了。
 *    改用「可注册域名是否变化」判定，并要求跳转链中出现过 301/308。
 *    moved 的 note 会同时记录新旧地址，便于随时回退。
 *
 * 用法：
 *   node scripts/check-links.mjs                        # 全量 dry-run
 *   node scripts/check-links.mjs --write                # 全量并把结果写回 JSON
 *   node scripts/check-links.mjs --only=sourcing        # 只查某个分类
 *   node scripts/check-links.mjs --concurrency=16 --timeout=20000
 * 对应 npm script：`npm run check:links` / `npm run check:links:write`
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_FILE = `${ROOT}src/data/site-data.json`;

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const getFlag = (name, fallback) => {
	const hit = argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : fallback;
};

const WRITE = hasFlag("write");
const ONLY = getFlag("only", "");
const CONCURRENCY = Math.max(1, Number(getFlag("concurrency", "8")) || 8);
const TIMEOUT = Math.max(1000, Number(getFlag("timeout", "12000")) || 12000);

const TODAY = new Date().toISOString().slice(0, 10);

/** 部分站点会拦截无 UA 的请求，伪装成普通浏览器 */
const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** 命中即认为最终地址是登录墙 / 鉴权页 / 错误页，不是站点真的搬家 */
const WALL_RE =
	/(login|logon|signin|sign-in|passport|authorize|oauth|sso|verify|captcha|error|not-?found)/i;

/** 单条链接最多跟随的跳转次数 */
const MAX_HOPS = 6;

const KIND_LABEL = {
	ok: "正常",
	wall: "跳转但未改写 url（登录墙 / 临时跳转 / 同域跳转）",
	moved: "域名永久迁移（写回新 url）",
	dnserror: "域名已不存在（写回 status=broken）",
	httperror: "HTTP 错误（仅报告，需人工确认）",
	unreachable: "本机不可达（仅报告，需人工确认）",
};

/** 汇总与明细的输出顺序 */
const KIND_ORDER = [
	"ok",
	"wall",
	"moved",
	"dnserror",
	"httperror",
	"unreachable",
];

/** 会被 --write 改写的类型 */
const WRITABLE = new Set(["ok", "wall", "moved", "dnserror"]);

function parseUrl(rawUrl) {
	try {
		return new URL(rawUrl);
	} catch {
		return null;
	}
}

/** 常见多段后缀，用于正确切出可注册域名（com.cn / co.uk 等） */
const MULTI_SUFFIX =
	/\.(com|net|org|gov|edu)\.(cn|hk|tw|uk|jp|kr)$|\.co\.(uk|jp|kr)$/i;

/**
 * 取「可注册域名」（eTLD+1）。
 * 用可注册域名而非主机名比较，避免把地域分站 / CDN 子域跳转当成域名迁移。
 */
function registrableDomain(rawUrl) {
	const url = parseUrl(rawUrl);
	if (!url) return "";
	const host = url.hostname.replace(/^www\./, "");
	return MULTI_SUFFIX.test(host)
		? host.split(".").slice(-3).join(".")
		: host.split(".").slice(-2).join(".");
}

/**
 * 探测单个 URL，手动跟随跳转以记录跳转链是否为永久跳转。
 * 先发 HEAD；只要 HEAD 不是 2xx 就退回 GET 复测。
 * 每拿到响应头立刻 cancel body，避免把整页拉下来。
 *
 * @returns {Promise<{status:number, finalUrl:string, permanent:boolean, error:Error|null}>}
 */
async function probe(url) {
	let lastError = null;

	for (const method of ["HEAD", "GET"]) {
		try {
			let current = url;
			let permanent = false;

			for (let hop = 0; hop < MAX_HOPS; hop += 1) {
				const res = await fetch(current, {
					method,
					redirect: "manual",
					signal: AbortSignal.timeout(TIMEOUT),
					headers: { "user-agent": USER_AGENT, accept: "*/*" },
				});
				if (res.body) {
					try {
						await res.body.cancel();
					} catch {
						/* 忽略取消失败 */
					}
				}

				const location =
					res.status >= 300 && res.status < 400
						? res.headers.get("location")
						: null;

				if (location) {
					if (res.status === 301 || res.status === 308) permanent = true;
					current = new URL(location, current).href;
					continue;
				}

				if (method === "HEAD" && !(res.status >= 200 && res.status < 300)) {
					break;
				}
				return { status: res.status, finalUrl: current, permanent, error: null };
			}

			if (method === "GET") {
				return {
					status: 0,
					finalUrl: current,
					permanent,
					error: new Error(`跳转次数超过 ${MAX_HOPS} 次`),
				};
			}
		} catch (error) {
			lastError = error;
		}
	}

	return { status: 0, finalUrl: url, permanent: false, error: lastError };
}

/**
 * 把探测结果归类
 * @returns {{kind:string, status?:string, url?:string, note?:string}}
 */
function classify(link, result) {
	if (result.status === 0) {
		const code = result.error?.cause?.code || result.error?.code || "";
		// DNS 解析失败说明域名确实已不存在，是唯一能据此判定「失效」的信号
		if (code === "ENOTFOUND") {
			return {
				kind: "dnserror",
				status: "broken",
				note: `域名解析失败（探测于 ${TODAY}）`,
			};
		}
		const reason =
			result.error?.name === "TimeoutError" ? "连接超时" : "无法访问";
		return {
			kind: "unreachable",
			note: `${reason}${code ? `：${code}` : ""}（探测于 ${TODAY}）`,
		};
	}

	if (result.status >= 200 && result.status < 400) {
		const wentToWall =
			WALL_RE.test(result.finalUrl) && !WALL_RE.test(link.url);
		if (wentToWall) {
			return { kind: "wall", status: "active" };
		}

		const oldDomain = registrableDomain(link.url);
		const newDomain = registrableDomain(result.finalUrl);
		const domainChanged = Boolean(newDomain) && oldDomain !== newDomain;

		// 非永久跳转（302/307）多为地域分站或临时路由，不据此改写数据
		if (domainChanged && result.permanent) {
			return {
				kind: "moved",
				status: "active",
				url: result.finalUrl,
				note: `原 ${link.url} 已 301 迁移至 ${result.finalUrl}（探测于 ${TODAY}）`,
			};
		}

		return { kind: domainChanged ? "wall" : "ok", status: "active" };
	}

	// 4xx / 5xx：可能是真失效，也可能是反爬、需登录、SPA 路由未命中或临时故障
	return { kind: "httperror", note: `HTTP ${result.status}（探测于 ${TODAY}）` };
}

async function main() {
	const data = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

	const targets = [];
	for (const category of data.categories) {
		if (ONLY && category.id !== ONLY) continue;
		for (const sub of category.subcategories || []) {
			for (const link of sub.links || []) {
				targets.push({ link, category, sub });
			}
		}
	}

	if (targets.length === 0) {
		console.log(ONLY ? `未找到分类 ${ONLY} 下的任何链接。` : "未找到任何链接。");
		process.exit(0);
	}

	console.log(
		`探测 ${targets.length} 个链接（并发 ${CONCURRENCY} / 超时 ${TIMEOUT}ms）` +
			(WRITE ? "，结果将写回 JSON" : "，dry-run 不写文件"),
	);

	const startedAt = Date.now();
	const results = new Array(targets.length);
	let cursor = 0;
	let done = 0;

	async function worker() {
		while (cursor < targets.length) {
			const index = cursor++;
			results[index] = classify(
				targets[index].link,
				await probe(targets[index].link.url),
			);
			done += 1;
			process.stdout.write(`\r  进度 ${done}/${targets.length}`);
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () =>
			worker(),
		),
	);
	process.stdout.write("\r");

	const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
	const buckets = Object.fromEntries(KIND_ORDER.map((kind) => [kind, []]));
	results.forEach((result, index) => {
		buckets[result.kind].push({ ...targets[index], result });
	});

	console.log(`探测完成，用时 ${elapsed}s`);
	for (const kind of KIND_ORDER) {
		console.log(`  ${KIND_LABEL[kind]}：${buckets[kind].length}`);
	}

	// ok 数量多且无信息量，不逐条展开
	for (const kind of ["moved", "dnserror", "wall", "httperror", "unreachable"]) {
		if (buckets[kind].length === 0) continue;
		console.log(`\n${KIND_LABEL[kind]}：`);
		for (const { link, category, sub, result } of buckets[kind]) {
			console.log(`  [${category.name} / ${sub.name}] ${link.name}`);
			if (result.url) {
				console.log(`      ${link.url}\n        -> ${result.url}`);
			} else {
				console.log(
					`      ${link.url}  ${result.note ? `(${result.note})` : ""}`,
				);
			}
		}
	}

	const writeCount = KIND_ORDER.filter((kind) => WRITABLE.has(kind)).reduce(
		(sum, kind) => sum + buckets[kind].length,
		0,
	);

	if (!WRITE) {
		console.log(
			`\ndry-run 结束，未修改任何文件。写回时会更新 ${writeCount} 条；` +
				`${results.length - writeCount} 条（本机不可达 / HTTP 错误）不会被自动改写。`,
		);
		console.log("确认无误后运行：npm run check:links:write");
		return;
	}

	let changed = 0;
	results.forEach((result, index) => {
		if (!WRITABLE.has(result.kind)) return;
		const { link } = targets[index];
		const before = JSON.stringify(link);

		if (result.url) link.url = result.url;
		if (result.status && link.status !== result.status) {
			link.status = result.status;
		}
		// ok / wall 保留原 note（多为人工备注），只有迁移或失效才覆盖
		if (result.note && link.note !== result.note) link.note = result.note;

		if (JSON.stringify(link) !== before) changed += 1;
	});

	data.meta.healthCheckedAt = `${TODAY}T00:00:00+08:00`;
	data.meta.updatedAt = `${TODAY}T00:00:00+08:00`;
	writeFileSync(DATA_FILE, `${JSON.stringify(data, null, "\t")}\n`, "utf-8");

	console.log(
		`\n已写回 src/data/site-data.json，实际变更 ${changed} 条链接` +
			`（${results.length - writeCount} 条仅报告项保持原样）。`,
	);
}

await main();
