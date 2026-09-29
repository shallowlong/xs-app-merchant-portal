# 验证清单：修复 CI 校验脚本

| 项 | 状态 | 命令/证据 |
|----|------|----------|
| `check:spec` | ✅ | `node ci/check-spec-refs.cjs` → 「AI 规范引用检查通过（章节引用 / 门禁措辞 / 路径存在性）」 |
| `check:skill` | ✅ | 「Skill 双副本同步校验通过」；`cmp` 确认镜像与 canonical 逐字节一致 |
| `check:deps` | ✅ | `--test-dir=src` → 「幽灵依赖检查通过」 |
| `check:kb` | ✅ | 「知识库目录不存在，跳过事实核查」 |
| `check:commit` | ✅ | 无提交时按设计安全跳过，`exit 0` |
| `npm run check` 聚合 | ✅ | `exit 0`，4 项依次通过 |
| 负向用例：幽灵依赖 | ✅ | 临时 fixture 注入 5 种导入 → 只报 `totally-not-declared-pkg` 与 `@fake-scope/pkg`；`@/...`、`node:fs`、`fs/promises`、相对路径均不误报 |
| 负向用例：路径存在性 | ✅ | 临时向 `AGENTS.md` 注入 `src/not-a-real-file.js` → `check:spec` 失败并命中该路径；测试脚本 `finally` 还原原文，已确认无残留 |
| `.claude/` 可入库 | ✅ | `git check-ignore .claude` 未命中，镜像不会被 gitignore 挡在 CI 之外 |
| 单测 | N/A | 本项目无测试框架；`ci/*.cjs` 以正/负向用例替代 |
| 知识库事实核查 | ✅ | `npm run check:kb` 跳过（`docs/knowledge/` 未创建） |
| 提交规范 | ☐ | Conventional Commits；按门禁**不自动提交**，改动留工作区待审查 |
