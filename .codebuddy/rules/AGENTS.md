# 电商人门户站 — workbuddy 项目规范副本

> 权威见仓库根 `AGENTS.md`，冲突以 AGENTS.md 为准。

---

# AGENTS.md — 电商人门户站 AI 协作规范

> 本仓库 AI 协作唯一权威规范，所有 agent 共同遵守；冲突以本文件为准。执行清单见 `SKILL.md`（`.agents/skills/` 与 `.claude/skills/` 双副本逐字一致，CI 强制同步）。

## 0. 需求确认门禁（最高优先级）

动手写代码前，先与用户就目标达成共识。

**用最简清单澄清（不凭空假设）：**
1. 目标与验收标准（做成什么样算完成）
2. 范围边界（只改 A 还是连带 B）
3. 约束与偏好（现有规范 / 兼容性 / 不动的文件）
4. 复用优先（先查 §2/§3 可复用资源）

**执行：** 复述「我将要做 / 我不会做」→ 用户确认 OK 后才开发。需求已明确可缩短确认，但仍须复述验收标准并等确认。

## 1. 仓库职责与协作边界

<!-- TODO: 填职责、协作边界 -->

## 2. 技术栈与代码定位

> 用表格列出「想做什么 → 去哪个目录改」，让 AI 不瞎找文件。下面的行由 `init.js` 的 `detectProject()` 根据目标项目真实目录**自动探测生成**；若某行探测不到则保留通用占位，接手后请人工核对/补充。

| 想做什么 | 去哪里改 |
|---------|---------|
| 改样式 / 设计令牌 | `src/styles/` |
| 页面 / 视图 | `src/router`、`src/views/` |
| UI 组件 | `src/components/` |
| 状态管理 | `src/stores/` |
| 接口 / 数据请求 | `src/api/` |
| 唯一数据源（导航/文案/SEO 全量） | `src/data/site-data.json` |
| 通用工具函数 | `src/utils/` |
| 链接健康检查脚本 | `scripts/` |
| 部署配置（Vercel） | `vercel.json` |
| 文档 / 方案 | `docs/` |

## 3. 知识库与文档归档

- 目录 `docs/knowledge/`，入口 `docs/knowledge/README.md` 为索引；**默认只读索引，按需读具体文件，不全文加载**。
- 知识库与代码不一致时以代码为准；改动知识库后跑事实核查（`ci/check-knowledge-facts.py`）。
- 动代码前先查可复用资源（配置/令牌/helper/组件），避免重复造轮子。
- 方案文档 `docs/designs/{YYYY-MM-DD}-{功能简称}/`（`spec.md` / `plan.md` / `checklist.md`）。

## 4. 编码规范

<!-- TODO: 填语言/框架约定、缩进、模块系统 -->

## 5. 工作流程

流程总览：**方案 → 开发 → 验证 → 提交 → 发版**。任何任务开始前，必须先满足 **§0 需求确认门禁**（与用户就目标/验收标准达成共识后才动手）。涉及开发、验证或发版时，先调用 `$merchant-portal-dev` skill，按其中的执行顺序与完成条件推进；其他环境按下述门禁执行。

**方案门禁**：涉及行为、结构或多文件改动的任务，先在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 写方案文档（模板 `docs/designs/_template/`），写明：要解决的问题、技术方案、影响范围、需同步的文档。

**验证门禁**：
- `scripts/`（或你项目的核心逻辑目录）有改动 → 必须跑 `vite build`
- 改动工具链接数据后 → 跑 `npm run check:links` 看 dry-run 报告；确认无误再用 `npm run check:links:write` 写回
  （默认只报告不写文件，本机不可达的站点不会被自动判为失效）
- 新增/修改纯函数 → 补充单测并跑 `npm run check`（lint + 单测 + 依赖声明检查 + 知识库核查）
- 知识库有改动 → 跑硬事实核查脚本
- UI 改动量不大时无需自检流程，除非用户明确要求
- 验证结果记录在方案目录 `checklist.md`

**提交门禁**：
- 遵循 §7 Git 规范；一次提交对应一个需求点
- **不自动提交**，改动保留在工作区供审查，仅在用户明确要求时提交与 push

**文档同步门禁**：
- 涉及代码、配置或行为变化时，必须同步知识库（若有）与 Wiki
- 若你的项目启用了发版前提交登记完整性检查（如自定义的 `ci/check-release-docs.js`），则登记缺失即阻断发版

**新增功能 Checklist**（必须覆盖全部相关维度）：
1. 核心代码目录
2. 样式目录（如需）
3. 前端脚本（如需）
4. `docs/` — 方案 + 执行计划 + 测试记录
5. 国际化文案（如需）
6. 知识库（涉及代码/配置/行为变化时）

## 6. 架构总览

> 动代码前先读架构文档建立整体认知（可指向 `docs/knowledge/overview.md` 或你项目的等价物）。

## 7. Git 规范

Conventional Commits：`<type>(<scope>): <description>`。type 白名单以 `ci/check-commit-msg.cjs` 为准。

- 一次提交对应一个需求点；逻辑相似可合并
- 合并代码时把 PR 标题改为 Conventional Commits 格式，不保留默认 `Merge ...` 标题
- 每个需求完成后不自动提交，改动保留在工作区供审查

## 8. 发版规范

按需启用。版本号推导：仅 fix/perf/style → patch；含 feat/refactor → minor；Breaking → major。
流程：CHANGELOG 非空章节 → 版本号推导 → 提交登记 → 用户确认 → 正式发版。

## 9. 关键约束

<!-- TODO: 填兼容性、禁止事项 -->

## 10. Issue 处理

- 调查 issue 后先询问用户是否回复，确认后再发出
- 修复的 issue 打 `resolved` 标签由 CI 自动关闭，agent 不直接 close

---

<!-- PATH-CHECK: src/ scripts/ docs/designs/ -->
<!-- 路径存在性检查：反引号路径命中上述前缀时必须真实存在。 -->
