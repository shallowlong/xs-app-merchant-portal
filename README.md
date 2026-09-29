# xs-app-merchant-portal

> **电商人工具门户站**
> 电商零售运营工具导航 · 8 大类 234 个工具 · 单页滚动 · 纯静态

![license](https://img.shields.io/badge/license-MIT-blue) ![vue](https://img.shields.io/badge/Vue-3-42b883) ![element](https://img.shields.io/badge/Element_Plus-2-409eff) ![vite](https://img.shields.io/badge/Vite-8-646cff)

## 这是什么

一个**纯前端、无后端**的单页导航站，把电商零售运营会用到的工具按类目聚合到一个页面上。
所有分类在同一页自上而下排列，左侧栏随滚动位置联动高亮。

- **没有服务端**：`npm run build` 的产物是纯静态文件，可直接丢到任意静态托管
- **没有接口**：全站数据来自仓库内唯一的 JSON 文件（见下方「数据与维护」）
- **没有统计与追踪**：不埋点、不写 Cookie、不写 localStorage

工具数据抓取自 [纺支宝服装网 - 电商零售工具导航](https://pages.fangzhibao.com/onlineretailertool)，
并在此基础上做了去重、分类订正与链接体检。

## 功能

- **单页滚动导航** —— 8 个分类在同一页顺序渲染，左栏高亮由滚动位置驱动（触发线判定，
  非 IntersectionObserver，以适配高度差异极大的分类区块）；访问 `/#<分类id>` 可直接定位
- **全局搜索** —— 按名称 / 描述 / 标签匹配，300 ms 防抖，结果带「分类 › 子分类」归属
- **网格卡片** —— 每个工具展示图标 + 名称 + 网址 + 描述，悬停上浮
- **三级降级的站点图标** —— 站点自身 `favicon.ico` → `api.xinac.net` → 名称首字色块，
  任一级加载失败自动降级；懒加载 + `no-referrer`，仅当图标进入视口才请求
- **链接健康检查脚本** —— 批量探测 234 条链接可达性并写回数据（见下方）
- **法务弹窗** —— 页脚的隐私政策 / 免责声明 / 联系我们，正文同样存在数据文件中

## 数据与维护

**全站唯一数据源：`src/data/site-data.json`**（导航、界面文案、SEO、版权文案全在这里）。

```
meta        站点身份（siteName / siteSubtitle / 数据来源 / 体检与更新时间）
seo         description / keywords（构建期注入 index.html）
ui          header / sidebar / home / labels / footer（含三份法务弹窗全文与联系方式）
quickLinks  快捷入口
categories  分类 → 子分类 → 链接
```

读取链路：`site-data.json` → `src/api/site.js` → `src/stores/site.js` → 组件。
**组件里不硬编码任何文案**，改文案只改这个 JSON。分类与链接均按 `sortOrder` 排序，
调整展示顺序也是纯数据改动。

### 添加或修改工具

1. 编辑 `src/data/site-data.json` 的 `categories`，新链接 id 续编（当前到 `lnk-234`）
2. `npm run check:links` 看 dry-run 报告，确认新 URL 可达
3. 确认无误后 `npm run check:links:write` 写回 `status` / `url` / `note`

### 链接健康检查

```bash
npm run check:links                          # dry-run，只出报告，不改文件
npm run check:links:write                    # 确认后写回 JSON
node scripts/check-links.mjs --only=sourcing # 只查某个分类
node scripts/check-links.mjs --concurrency=16 --timeout=20000
```

脚本刻意保守 —— **只有 4 类结果会写回**：

| 结果                        | 判定                                    | 写回                             |
| --------------------------- | --------------------------------------- | -------------------------------- |
| `ok`                        | 2xx，可注册域名未变                     | `status=active`                  |
| `wall`                      | 跳转或登录墙，刻意不改 url              | `status=active`                  |
| `moved`                     | 可注册域名变化且链上有 301/308 永久跳转 | `status=active` + `url` + `note` |
| `dnserror`                  | DNS 解析失败（域名已不存在）            | `status=broken` + `note`         |
| `httperror` / `unreachable` | 4xx / 5xx / 超时 / 连接失败             | ❌ **仅报告，需人工确认**        |

> ⚠️ **本机不可达 ≠ 站点失效。** ChatGPT、视觉中国、Pexels 等境外站点从境内网络一律连不上，
> 但工具本身有效。因此超时与 4xx/5xx 都不会被自动判为失效，只会列进报告待人工判断。
>
> 同理，后台类入口（拼多多商家后台、生意参谋）会被重定向到带一次性 token 的登录地址，
> 脚本不会把它写回数据，以免破坏原始入口。

## 技术栈

| 领域 | 选型                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| 构建 | Vite 8（Node **22.x**）                                                                    |
| 框架 | Vue 3.5（Composition API + `<script setup>`，纯 JavaScript）                               |
| 路由 | Vue Router 5（**web history**，旧 `/category/:id` 静默重定向到 `/#<id>`）                  |
| 状态 | Pinia 4                                                                                    |
| UI   | Element Plus 2.14（`unplugin-auto-import` + `unplugin-vue-components` **按需引入**）       |
| 图标 | `@element-plus/icons-vue`                                                                  |
| 样式 | SCSS（设计令牌在 `src/styles/variables.scss`，组件库主题映射在 `src/styles/element.scss`） |
| 部署 | Vercel（`vercel.json`，含 SPA 回退）                                                       |

> Element Plus 采用**按需引入**而非全量引入：全量引入会让产物从 130 kB gzip 涨到 394 kB gzip。

## 快速开始

```bash
npm install       # 安装依赖（需 Node 22.x）
npm run dev       # 开发服务器 → http://localhost:3000
npm run build     # 生产构建 → dist/
npm run preview   # 预览构建产物
```

## 目录结构

```
src/
├── api/          数据源抽象层（换远程接口只需改这里）
├── components/   UI 组件
│   └── layout/   页头 / 左侧栏 / 页脚
├── data/         唯一数据源 site-data.json
├── router/       路由定义
├── stores/       Pinia 状态管理
├── styles/       设计令牌与全局样式
├── utils/        工具函数（文案模板插值、favicon 取用）
├── views/        页面级组件
├── App.vue
└── main.js

scripts/          链接健康检查脚本
ci/               规范引用 / 技能同步 / 幽灵依赖 / 知识库 / 提交信息校验
docs/designs/     方案文档（spec / plan / checklist）
```

## 部署

推到 `main` 分支后由 Vercel 自动部署（配置已写在 `vercel.json`）：

| 设置项           | 值              |
| ---------------- | --------------- |
| Framework Preset | Vite            |
| Install Command  | `npm install`   |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |

**为什么必须配 `rewrites`**：本项目用 web 路由（`createWebHistory`），
访问 `/category/design-creative` 这类深链时服务器上并不存在对应文件，不做回退就会 404。
`vercel.json` 里配了 `/(.*)` → `/index.html` 的全量回退；
因为 Vercel 的 rewrites 是**先查静态文件、命中则不重写**，`/assets/*` 与 `/favicon.svg` 不受影响。

> 注意：用 hash 路由的项目（如 `xs-app-nte`）**不需要**这条回退规则，配置不可跨项目照搬。

`/assets/*` 额外下发了 `max-age=31536000, immutable` —— Vite 产物文件名带内容哈希，
内容变了文件名就变，可安全长缓存；`index.html` 刻意不加，保证发版即时生效。

## AI 协作规范

本仓库接入 `ai-dev-conventions-scaffold` 规范体系：

- **`AGENTS.md`** —— 唯一权威规范，所有 AI 工具与开发者共同遵守
- `CLAUDE.md` / `.codebuddy/rules/AGENTS.md` —— 兼容入口与合并副本（冲突以 `AGENTS.md` 为准）
- `$merchant-portal-dev` —— 开发流程执行清单（`.agents/skills/` 与 `.claude/skills/` 双副本，CI 强制同步）

**修改规范请改根 `AGENTS.md`**，再同步各副本（`npm run check:skill:sync` 负责 skill 镜像）。

### 本地校验

```bash
npm run build              # 生产构建
npm run check              # 聚合校验（spec + skill + deps + kb）
npm run check:spec         # 规范引用与路径存在性检查
npm run check:skill        # 执行清单双副本同步检查
npm run check:skill:sync   # 从 canonical 同步到 .claude 镜像
npm run check:deps         # 幽灵依赖检查
npm run check:kb           # 知识库硬事实核查
npm run check:commit       # 提交信息规范检查（origin/main..HEAD）
npm run check:links        # 链接健康检查（dry-run）
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
`<type>(<scope>): <description>`，type ∈ `feat|fix|refactor|perf|style|docs|chore|content|release`。

## 版权与许可

本项目基于 **MIT License** 发布，版权归 **XISHU (shallowlong@gmail.com)** 所有（2025-2026）。

- 法律声明：仓库根 [`LICENSE`](./LICENSE)
- 包元数据：`package.json` 的 `author` / `license`
- 页面展示：页脚读 `src/data/site-data.json` 的 `ui.footer.copyright`，
  对外显示名为 **奚叔2099**，并附作者主页 <https://xishu2099.top>

> 本站为导航聚合类网站，所有链接均指向第三方网站，本站不对第三方内容负责；
> 收录站点的名称、商标、LOGO 归各自权利人所有，本站仅作导航引用。
> 详见站内「免责声明」与「隐私政策」。
