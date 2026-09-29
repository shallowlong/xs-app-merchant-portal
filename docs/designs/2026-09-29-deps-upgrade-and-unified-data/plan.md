# 执行计划：依赖升级 + 数据单一事实来源 + Element Plus 改写

- [x] 核心代码：新增/改写数据层（`site-data.json` / `api/site.js` / `stores/site.js` / `utils/format.js`）
- [x] 核心代码：Element Plus 改写 7 个组件 + `App.vue` + `Home.vue`
- [x] 样式：新增 `styles/element.scss`，把 Element Plus CSS 变量对齐品牌令牌
- [x] 前端脚本：`vite.config.js` 接入 SEO 注入插件与按需引入插件；`main.js` 调整
- [x] 文档：`AGENTS.md` §2 目录映射补充唯一数据源与 `src/utils/`
- [x] 清理：删除 5 个重复/失效文件
- [ ] 国际化文案：本项目为中文单语站点，无 i18n 体系，不涉及
- [x] 单测（纯函数改动）：`utils/format.js` 为纯函数，但本仓库无测试框架，
      以构建 + 无头浏览器渲染回归替代（见 `checklist.md`）
- [ ] 遗留：`package.json` 中 `check:spec` / `check:skill` / `check:deps` 的后缀错误未修（本次范围外）

预计验证命令：`npx vite build` + 无头 Edge 渲染回归
