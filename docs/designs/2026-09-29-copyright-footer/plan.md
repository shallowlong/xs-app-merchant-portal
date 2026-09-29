# 执行计划：页脚版权信息对齐 LICENSE / package.json

- [x] 核心代码：`src/data/site-data.json` 的 `ui.footer.copyright` 结构化
- [x] 核心代码：`src/stores/site.js` 的 `footerCopyright` getter 与 `createEmptyUi()` 占位结构
- [x] 核对 `LICENSE` / `package.json`：与参考文件一致，确认无需改动
- [x] 文档：本方案目录三件套
- [ ] 样式：不涉及（复用既有 `.app-footer__copyright` 样式）
- [ ] 前端脚本 / 构建配置：不涉及
- [ ] 国际化文案：单语站点，不涉及
- [ ] 单测：无测试框架，以构建 + 无头渲染回归覆盖

预计验证命令：`npx vite build` + 无头 Edge 渲染核对页脚文本
