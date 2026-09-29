# 执行计划：增加 Vercel 部署支持

- [x] 部署配置：新增 `vercel.json`（framework / build / output + SPA rewrites + 静态资源长缓存）
- [x] 配置：`package.json` 的 `engines.node` 由 `>=20.19.0` 收紧为 `22.x`
- [x] 文档：`AGENTS.md` §2 与 `.codebuddy/rules/AGENTS.md` 补「部署配置」目录映射
- [x] 文档：本方案目录三件套
- [ ] 核心代码 / 样式 / 前端脚本：不涉及（不改任何 `src/`）
- [ ] 国际化文案：不涉及
- [ ] 单测：配置类改动，以 rewrite 语义模拟 + 深链端到端验证替代

预计验证命令：`node tmp-vercel-sim.mjs`（rewrite 语义模拟）、`npx vite build`、`npm run check`、
无头 Edge 访问 `/category/design-creative`
