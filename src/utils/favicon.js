/**
 * 站点图标（favicon）取用策略
 *
 * 三级降级，逐级在前一级 `<img>` 触发 error 时切换到下一级：
 *   1. 站点自身的 `/favicon.ico` —— 零第三方依赖，且失败信号干净（会触发 error）
 *   2. `api.xinac.net` 图标服务 —— 兜住没有根 favicon 的站点
 *   3. 名称首字色块 —— 前两级都失败时的兜底
 *
 * 两个来自实测的取舍（见 docs/designs/2026-09-29-single-page-grid/checklist.md）：
 *
 * 1. **不用 Google / DuckDuckGo 的 favicon 接口**：本机实测两者均连接超时，国内环境不可用。
 * 2. **不用 favicon.im**：实测对不存在的域名也返回 200 + 占位 SVG（永远不触发兜底），
 *    且响应耗时 4.9s ~ 25s，不适合作为 234 条链接的主图标源。
 */

const FAVICON_SERVICE = "https://api.xinac.net/icon/?url=";

/**
 * 取 URL 的主机名
 * @param {string} rawUrl
 * @returns {string} 解析失败时返回空串
 */
export function hostOf(rawUrl) {
	try {
		return new URL(rawUrl).hostname;
	} catch {
		return "";
	}
}

/**
 * 按优先级返回候选图标地址，供 `<img>` 逐个尝试
 * @param {string} rawUrl
 * @returns {string[]}
 */
export function faviconSources(rawUrl) {
	const host = hostOf(rawUrl);
	if (!host) return [];
	return [`https://${host}/favicon.ico`, `${FAVICON_SERVICE}${host}`];
}

/**
 * 首字兜底用的字符
 * @param {string} name
 * @returns {string}
 */
export function initialOf(name) {
	const trimmed = (name || "").trim();
	return trimmed ? trimmed.charAt(0) : "?";
}

/**
 * 由名称稳定推导色相（0-359），保证同一站点每次都得到同一颜色
 * @param {string} text
 * @returns {number}
 */
export function hueOf(text) {
	let hash = 0;
	const source = text || "";
	for (let i = 0; i < source.length; i += 1) {
		hash = (hash * 31 + source.charCodeAt(i)) % 360;
	}
	return hash;
}
