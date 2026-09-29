# 执行计划：单页滚动布局 + 网格卡片 + 链接健康检查脚本

- [x] 核心代码：`scripts/check-links.mjs` 健康检查脚本（dry-run / --write / --only / 并发 / 超时）
- [x] 核心代码：`LinkCard.vue` 网格卡片（图标 + 名称 + 网址 + 描述 + hover 上浮）
- [x] 核心代码：`utils/favicon.js` 三级图标降级
- [x] 核心代码：`Home.vue` 单页顺序渲染 + 滚动联动高亮 + hash 同步
- [x] 核心代码：`AppSidebar.vue` 点击滚动到锚点（不再切路由）
- [x] 核心代码：`router` 旧分类路由静默重定向、`sortOrder` 生效
- [x] 数据：新增「货源网站」分类（20 站点 / 4 子分类，置首）
- [x] 数据：移除 `ui.header.navLinks`
- [x] 数据：跑 `check:links:write` 写回健康检查结果
- [x] 样式：`.link-grid` 全局响应式网格
- [x] 文档：`AGENTS.md` / `.codebuddy/rules/AGENTS.md` / `SKILL.md` + `.claude` 镜像
- [x] 删除：`LinkItem.vue`
- [ ] 国际化文案：中文单语站点，不涉及
- [ ] 单测：本仓库无测试框架，以构建 + 无头 Edge 交互回归 + 脚本正负向用例替代

预计验证命令：`npx vite build`、`npm run check`、`npm run check:links`
