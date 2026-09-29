# 验证清单：增加 Vercel 部署支持

| 项 | 状态 | 命令/证据 |
|----|------|----------|
| `vercel.json` 语法 | ✅ | `JSON.parse` 通过；字段为 `$schema / framework / installCommand / buildCommand / outputDirectory / rewrites / headers` |
| 产物结构匹配配置 | ✅ | `dist/` = `index.html` + `favicon.svg` + `assets/`；`assets/` 下均为内容哈希命名（如 `index-Eo2YWU5I.js`），确认 `/assets/*` 可安全 immutable 长缓存 |
| rewrite 语义模拟 | ✅ | 本地按「先静态文件、未命中再 rewrite」实现 Vercel 语义，对真实 `dist` 跑 6 个用例，全部通过（见下表） |
| SPA 深链端到端 | ✅ | 无头 Edge 访问 `/category/design-creative` → 渲染 8 个分类区块、234 张卡片，侧栏高亮「设计与创意（57 个工具）」，说明回退 + 前端重定向 + 锚点定位全部生效 |
| 全量构建 | ✅ | `npx vite build` → `✓ built in 1.31s` |
| CI 检查 | ✅ | `npm run check` → exit 0（spec / skill / deps 通过，kb 跳过） |
| 单测 | N/A | 本仓库无测试框架；配置类改动以模拟 + 端到端验证覆盖 |
| 提交规范 | ☐ | 按门禁**不自动提交**，改动留工作区待审查（用户确认后再提交推送） |

## rewrite 模拟用例明细

按 Vercel 的 `rewrites` 语义（**先匹配静态文件，未命中才应用 rewrite**）在本地复现：

| 请求路径 | 期望 | 实际 | 命中来源 |
|---|---|---|---|
| `/` | 200 text/html | ✅ | `root-index` |
| `/category/design-creative` | 200 text/html | ✅ | `rewrite/index.html` |
| `/category/abc#design-creative` | 200 text/html | ✅ | `rewrite/index.html` |
| `/not-exist-at-all` | 200 text/html | ✅ | `rewrite/index.html` |
| `/assets/index-*.js` | 200 application/javascript | ✅ | `static-file`（未被 rewrite 吞掉） |
| `/favicon.svg` | 200 image/svg+xml | ✅ | `static-file`（未被 rewrite 吞掉） |

> 过程中修掉一个**验证脚本自身**的缺陷：把 `/(.*)` 转正则时 `*` 漏了转义、
> `(.*)` 被当成字面量，导致 3 个深链用例误报 404。修正后全部通过 —— 是脚本的 bug，非配置问题。

## 未验证项（需账号权限，如实说明）

- 未安装 Vercel CLI，**未执行真实 `vercel build` / `vercel deploy`**，因此：
  - `framework` / `buildCommand` / `outputDirectory` 的字段名正确性依据官方 schema 与兄弟项目先例，未由 CLI 校验
  - `headers` 的实际下发行为未在线上确认
- 建议首次部署后用 `curl -I` 核对 `/assets/xxx.js` 是否返回 `cache-control: public, max-age=31536000, immutable`
