# 验证清单：依赖升级 + 数据单一事实来源 + Element Plus 改写

| 项 | 状态 | 命令/证据 |
|----|------|----------|
| 全量构建 | ✅ | `npx vite build` → `✓ built in 1.11s`，1663 modules，无告警 |
| 渲染回归（首页） | ✅ | Edge `--headless=new --dump-dom http://localhost:4174/` |
| 渲染回归（分类路由） | ✅ | `/category/design-creative` → 卡片标题「设计与创意」、57 条链接、侧栏该项 `is-active` |
| SEO 注入 | ✅ | `<title>电商人工具门户站</title>`、`description`、`keywords` 均来自 `site-data.json` |
| 文案模板插值 | ✅ | `共收录 <strong>214</strong> 个工具`；`发现 214 个电商运营工具`；`© 2026 电商人工具门户站. All rights reserved.` |
| 弹窗初始态 | ✅ | `el-overlay` 为 `display: none`，未打开时不遮挡页面 |
| 布局几何 | ✅ | 视口 1111px 下 `.app-footer` bottom=1118 = `.app-layout` bottom，页脚贴底无空隙 |
| 主题令牌覆盖顺序 | ✅ | 产物 CSS 中 `--el-color-primary` 出现顺序为 `#409eff` → `#1a73e8`（品牌色最终生效） |
| 产物体积 | ✅ | gzip 合计约 130 kB（全量引入方案为 394 kB） |
| 单测 | N/A | 本仓库无测试框架；`utils/format.js` 以渲染回归覆盖 |
| 知识库事实核查 | ✅ | `npm run check:kb` → 「知识库目录不存在，跳过事实核查」 |
| 规范引用检查 | ✅ | `npm run check:spec` → 「AI 规范引用检查通过」（脚本后缀错误已在 `2026-09-29-ci-script-fix` 修复） |
| 技能同步检查 | ✅ | `npm run check:skill` → 「Skill 双副本同步校验通过」 |
| 依赖声明检查 | ✅ | `npm run check:deps`（`--test-dir=src`）→ 「幽灵依赖检查通过」 |
| 提交规范 | ☐ | Conventional Commits；按门禁**不自动提交**，改动留工作区待审查 |
