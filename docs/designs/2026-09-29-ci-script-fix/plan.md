# 执行计划：修复 CI 校验脚本

- [x] 核心代码：无（本次不触碰 `src/`）
- [x] 脚本 / 配置：`package.json` 修 4 个后缀 + 补 `check` 聚合脚本 + 补 `check:skill:sync` + `check:deps` 改扫 `src`
- [x] 脚本：`ci/check-require-decls.cjs` 消除 `@/` 与 `node:` 两类假阳性
- [x] 脚本：用 `--sync` 生成 `.claude/skills/` 镜像
- [x] 文档：`AGENTS.md` 与 `.codebuddy/rules/AGENTS.md` 开启 `PATH-CHECK`
- [x] 文档：回填上一轮方案目录的 `checklist.md`
- [ ] 样式 / 前端脚本 / 国际化：不涉及
- [ ] 单测：`ci/*.cjs` 为一次性脚本，本项目无测试框架；
      改用「正向全绿 + 负向注入用例」验证，见 `checklist.md`
- [ ] 遗留：`findTestFiles()` 的 `dir /s /b` 仍为 Windows 专有（见 `spec.md`）

预计验证命令：`npm run check` + 负向注入用例
