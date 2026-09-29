# 方案：增加 Vercel 部署支持

## 背景与问题

项目此前没有任何部署配置，需要补齐 Vercel 部署支持。核心难点不在构建命令，而在 **SPA 路由回退**：

- 本项目用 `createWebHistory()`（真实路径路由），访问 `/category/design-creative` 这类深链时，
  服务器上并不存在该路径的静态文件，**不做回退就会 404**。
- 仓库内的兄弟项目做法并不一致，不能直接照抄：

| 项目 | router history | `vercel.json` 内容 | 是否需要 rewrites |
|---|---|---|---|
| `xs-app-nte` | `createWebHashHistory` | 仅 `rewrites` | 否（hash 路由不走服务端） |
| `xs-app-korean-learn` | `createWebHashHistory` | 仅 framework/build/output | 否 |
| `xs-app-backoffice` | `createWebHistory` | 仅 `rewrites` | **是** |
| **本项目** | `createWebHistory` | —— | **是** |

即：只要项目用 hash 路由就不需要回退，而本项目与 `xs-app-backoffice` 一样用 web 路由，必须配。

## 技术方案

新增 `vercel.json`：

```json
{
	"$schema": "https://openapi.vercel.sh/vercel.json",
	"framework": "vite",
	"installCommand": "npm install",
	"buildCommand": "npm run build",
	"outputDirectory": "dist",
	"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
	"headers": [
		{
			"source": "/assets/(.*)",
			"headers": [
				{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
			]
		}
	]
}
```

各项取舍：

- **`rewrites` 用朴素的 `/(.*)` 全量回退**（与 `xs-app-backoffice` 一致），不加
  `(?!assets/)` 之类的负向断言。因为 Vercel 的 `rewrites` 是**先查静态文件、命中则不重写**，
  所以已存在的 `/assets/*`、`/favicon.svg` 不受影响，写法越简单越不易出错。
- **`framework` / `buildCommand` / `outputDirectory` 显式声明**（与 `xs-app-korean-learn` 一致）：
  Vercel 的 Vite 预设虽然能自动识别，但显式写出可避免识别漂移。
- **`headers` 只给 `/assets/*` 加 immutable 长缓存**：Vite 产物文件名带内容哈希
  （如 `index-Eo2YWU5I.js`），内容变了文件名就变，因此可以安全长缓存；
  `index.html` 刻意不加，保证发版后立刻生效。
  不加这条的话每次访问都要重新校验约 300 kB 的 JS，对本项目收益明显。
- **未加任何环境变量 / 构建时注入**：本项目是纯静态前端，没有后端与环境相关配置。

### Node 版本

`package.json` 的 `engines.node` 由 `>=20.19.0` 收紧为 **`22.x`**。
Vercel 读 `engines.node` 决定构建环境的 Node 版本：开放区间会让它在未来某个时点
自动跳到未验证的大版本（如 Node 24）而静默改变构建结果；`22.x` 与本地开发环境
（Node 22.17.1）一致，也满足 Vite 8 的 `^20.19.0 || >=22.12.0` 要求。

## 影响范围

- 新增：`vercel.json`、本方案目录
- 改动：`package.json`（仅 `engines.node`）、`AGENTS.md` 与 `.codebuddy/rules/AGENTS.md`（§2 目录映射补一行）
- 不涉及任何 `src/` 代码、不影响本地构建与产物

## 可复用资源

- `xs-app-korean-learn/vercel.json` 的字段写法（`$schema` + framework + build/output）
- `xs-app-backoffice/vercel.json` 的 SPA 回退写法（同为 web 路由项目）
- 既有 `.gitignore` 已忽略 `.vercel`（Vercel CLI 的本地链接目录），无需改动

## 需同步文档

- 本方案目录三件套
- `AGENTS.md` §2 补部署配置行，`.codebuddy/rules/AGENTS.md` 同步
- 无 `docs/knowledge/` 知识库，不涉及

## 已知遗留（不在本次范围）

- 未接入 Vercel CLI，也未执行真实部署（需用户侧账号授权）。
- 未配置自定义域名、CSP 等安全响应头；如需再议。
