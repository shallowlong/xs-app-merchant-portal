# 方案：修复 CI 校验脚本

## 背景与问题

`package.json` 中 4 个校验脚本全部指向不存在的文件，`npm run check:*` 一律 `MODULE_NOT_FOUND`：

| 脚本 | 原指向 | 实际文件 |
|---|---|---|
| `check:spec` | `ci/check-spec-refs.js` | `ci/check-spec-refs.cjs` |
| `check:skill` | `ci/check-skill-sync.js` | `ci/check-skill-sync.cjs` |
| `check:deps` | `ci/check-require-decls.js` | `ci/check-require-decls.cjs` |
| `check:commit` | `ci/check-commit-msg.js` | `ci/check-commit-msg.cjs` |

此外还有 4 个连带缺陷（修完后缀才暴露出来）：

1. **`npm run check` 不存在**，但 `AGENTS.md` §5 与 `SKILL.md` 都要求跑它，
   `ci/check-spec-refs.cjs` 的 `GATE_PHRASES` 也把 `npm run check` 当作必须存在的门禁短语在核查。
2. **`check:skill` 必然失败**：`.claude/skills/<skill>/SKILL.md` 镜像缺失，
   `check-skill-sync.cjs` 报「镜像缺失」并 `exit 1`。
3. **`check:deps` 空转**：默认 `--test-dir=test`，本项目无测试目录，永远输出「未找到测试文件」并跳过。
4. **`check-require-decls.cjs` 存在三类假阳性**（把非 npm 包当成未声明依赖）：
   - `@/xxx` —— vite `resolve.alias` 的源码路径别名
   - `node:fs` —— 带 `node:` 前缀的 Node 内置模块
   - （`fs/promises` 这类子路径本身没问题，`split('/')[0]` 已能正确取到 `fs`）

另有一项一直处于「配置留空」状态：`AGENTS.md` 的 `PATH-CHECK` 标签为空，
`check-spec-refs.cjs` 的路径存在性检查因此从未真正执行。

## 技术方案

### 1. `package.json`

- 4 个脚本后缀 `.js` → `.cjs`
- 新增 `check` 聚合脚本：`npm run check:spec && npm run check:skill && npm run check:deps && npm run check:kb`
  （对齐 `AGENTS.md` §5 对 `npm run check` 的定义；本项目无 lint、无单测，故聚合这 4 项）
- 新增 `check:skill:sync`：暴露 `check-skill-sync.cjs --sync` 的同步入口，
  否则开发期要用镜像只能手敲完整 node 命令
- `check:deps` 改传 `--test-dir=src`：本项目无 `test/`，指向 `src` 才能让检查真正生效

### 2. `ci/check-require-decls.cjs`

两行小改，只消除假阳性，不放宽真实检查：

- 跳过 `@/` 开头的模块（源码路径别名，不是 scoped package）
- 取包名前先剥掉 `node:` 前缀

### 3. `.claude/skills/merchant-portal-dev/SKILL.md`

用脚本自带的官方补救手段生成镜像：`node ci/check-skill-sync.cjs --sync`。
不手写内容，保证与 canonical（`.agents/skills/...`）逐字节一致。

### 4. `AGENTS.md` 开启 `PATH-CHECK`

填为 `<!-- PATH-CHECK: src/ docs/designs/ -->`，让路径存在性检查真正生效。

**只列这两个前缀**是有意的：前缀一旦列入，文档中所有以它开头的反引号路径都必须真实存在，
而 `AGENTS.md` §3 引用了尚未创建的 `docs/knowledge/README.md`，列入 `docs/` 会立即导致检查失败。
未创建的占位目录故意不列入，避免把「尚未落地的规划」变成 CI 红灯。

## 影响范围

- `package.json`：scripts 段
- `ci/check-require-decls.cjs`：`main()` 内的包名解析
- `AGENTS.md`、`.codebuddy/rules/AGENTS.md`：`PATH-CHECK` 标签及其说明注释
- 新增 `.claude/skills/merchant-portal-dev/SKILL.md`（canonical 的逐字节镜像）
- 不涉及任何 `src/` 业务代码，不影响运行时行为与产物体积

## 可复用资源

- 现成的 5 个 `ci/*.cjs` 脚本本身，只改调用方式与两行解析逻辑，不重写
- `check-skill-sync.cjs --sync`：官方提供的镜像生成/修复入口
- `check-commit-msg.cjs` 的 type 白名单已与 `AGENTS.md` §7 一致，无需改动

## 需同步文档

- 本方案目录三件套
- `docs/designs/2026-09-29-deps-upgrade-and-unified-data/checklist.md`：
  原先标注「无法执行」的三项 CI 检查，现已可执行且通过，需回填

## 已知遗留（不在本次范围）

- `ci/check-require-decls.cjs` 的 `findTestFiles()` 使用 `execSync('dir /s /b ...')`，
  是 Windows cmd 专有命令，在 Linux/macOS 上会执行失败。
  当前无 CI 工作流配置（`.github/` 不存在），且本项目在 Windows 上开发，故本次不动；
  若将来接入 Linux CI，需改为 `fs.readdirSync(dir, { recursive: true })`。
