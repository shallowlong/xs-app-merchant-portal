# 方案：依赖升级 + 数据单一事实来源 + Element Plus 改写

## 背景与问题

1. **依赖落后一个大版本区间**：`vite 5` / `@vitejs/plugin-vue 5` / `pinia 2` / `vue-router 4`，
   与当前 Node v22.17.1 环境可支撑的最新版本差距较大。
2. **数据散落、存在多份互相冲突的副本**：
   - `src/data/navigation.json`（代码实际读取）
   - `navigation-tree.json`（抓取源 + 校验分析，代码未引用，`total_links: 222`）
   - `navigation-tree.md`
   - `src/data/navigation.json` 自报 `totalSubcategories: 30 / totalLinks: 219`，与真实数据（29 / 214）不一致
3. **界面文案硬编码在组件里**：页头标题与入口、侧栏分组标题、页脚三份弹窗全文与联系方式、
   首页标语、`index.html` 的 SEO meta，均无法通过改数据来维护。
4. **UI 组件库缺位**：没有任何组件库，弹窗、标签、空状态、加载态等均为手写，维护成本高。

## 技术方案

### 1. 依赖升级（选取最新大版本）

| 包 | 升级前 | 升级后 |
|---|---|---|
| `vite` | 5.4.21 | 8.3.1 |
| `@vitejs/plugin-vue` | 5.2.4 | 6.0.9 |
| `pinia` | 2.3.1 | 4.0.3 |
| `vue-router` | 4.6.4 | 5.3.1 |
| `vue` | 3.5.41 | 3.5.43 |
| `sass` | 1.102.0 | 1.105.0 |
| `element-plus` | — | 2.14.6（新增） |
| `@element-plus/icons-vue` | — | 2.3.2（新增） |
| `unplugin-auto-import` | — | 21.1.0（新增，按需引入） |
| `unplugin-vue-components` | — | 32.1.0（新增，按需引入） |

`package.json` 增加 `engines.node: >=20.19.0`。升级前先验证「旧代码 + 新依赖」能否构建，
以区分「依赖破坏性变更」与「本次改写引入的问题」。

### 2. 数据单一事实来源

新增 **`src/data/site-data.json`（唯一数据文件）**，结构：

```
meta        站点身份（siteName / siteSubtitle / source / fetchedAt / updatedAt）
seo         description / keywords（构建期注入 index.html）
ui          全部界面文案
  ├─ header    logoIcon / statTemplate / navLinks[]
  ├─ sidebar   sectionTitle / footerText / categoryTooltip
  ├─ home      greeting / searchPlaceholder / searchResultTitle / clearSearch / loadingText / empty
  ├─ labels    brokenBadge / errorText
  └─ footer    links[] / notice / copyrightTemplate / modals{privacy,disclaimer,contact}
quickLinks  快捷入口
categories  分类 → 子分类 → 链接（原有 214 条）
```

关键取舍：

- **删除 `meta` 中的 `totalCategories/totalSubcategories/totalLinks`**：这三个计数与实际数据不符，
  且 store 本就从 `categories` 实时计算，保留即为第二事实来源。
- **`meta.siteName` 同时充当页头标题与 `index.html` 的 `<title>`**，不再另设 `seo.title`。
- 可插值文案统一用 `{key}` 占位（如 `共收录 {count} 个工具`），由 `src/utils/format.js` 的
  `formatTemplate()` / `splitTemplate()` 渲染，避免把数字拼进文案字符串。
- `index.html` 书写 `%SEO_TITLE%` / `%SEO_DESCRIPTION%` / `%SEO_KEYWORDS%`，
  由 `vite.config.js` 中的 `siteDataSeoPlugin`（`transformIndexHtml`，`order: "pre"`）在构建期替换。
  选 `order: "pre"` 是为了抢在 Vite 自身的环境变量替换之前完成，避免未知变量告警。

### 3. 数据读取链路

```
src/data/site-data.json
  → src/api/site.js     （数据源抽象层，保留「换远程接口只改此文件」的扩展点）
  → src/stores/site.js  （useSiteStore：meta / ui / categories / quickLinks + 搜索与派生 getter）
  → 组件
```

`src/api/navigation.js` + `src/stores/navigation.js` 相应改名为 `site.js`，语义与文件内容一致。
store 的 `meta` / `ui` 初值为同构空壳（`createEmptyUi()`），保证异步加载期间模板访问不会报错。

### 4. Element Plus 全面改写

| 原手写实现 | 替换为 |
|---|---|
| 布局 `div.app-layout/.app-body/.app-main` | `el-container` / `el-header` / `el-aside` / `el-main` / `el-footer` |
| 侧栏 `button` 列表 | `el-menu` + `el-menu-item` + `el-scrollbar`，计数用 `el-tag` |
| 搜索输入框（含自定义清除按钮） | `el-input`（`clearable` + `prefix-icon`），保留 300ms 防抖 |
| 三个 `Teleport` 手写弹窗 | 单个 `el-dialog`，由 `activeModalKey` 驱动 |
| 手写加载 spinner | `el-skeleton` |
| 手写空状态 | `el-empty`（`#image` / `#description` 插槽） |
| 失效徽标 `<span>` | `el-tag type="warning"` |
| 分类容器 / 子分类标题 | `el-card`（`#header` 插槽）/ `el-divider` |
| 箭头与关闭图标 | `@element-plus/icons-vue`（`ArrowRight` / `Close` / `Search`） |
| 中文语言包 | `el-config-provider :locale="zhCn"` |

**按需引入**：`unplugin-auto-import` + `unplugin-vue-components` 搭配 `ElementPlusResolver`，
并以 `src/styles/element.scss` 把 Element Plus 的 CSS 变量对齐到 `src/styles/variables.scss` 品牌令牌。
全量引入会让产物从 57 kB gzip 涨到 394 kB gzip；按需引入后为 130 kB gzip。

### 5. 顺带修复

- `Home.vue` 原先只在 `setup` 时读一次 `route.params.categoryId`，`/category/a → /category/b`
  复用同一组件时不会切换分类；改为 `watch` + 数据加载后兜底激活。
- `router` 增加 `/:pathMatch(.*)*` 回落首页，避免直接刷新未知路径拿到空白页。
- `LinkItem` / `searchLinks` 对 `link.description` 做空值兜底，避免缺字段时抛错。

## 影响范围

- 新增：`src/data/site-data.json`、`src/api/site.js`、`src/stores/site.js`、`src/utils/format.js`、
  `src/styles/element.scss`、本方案目录
- 改写：`vite.config.js`、`index.html`、`package.json`、`src/main.js`、`src/App.vue`、
  `src/router/index.js`、`src/views/Home.vue`、`src/components/**` 全部 7 个组件
- 删除：`src/data/navigation.json`、`src/api/navigation.js`、`src/stores/navigation.js`、
  `navigation-tree.json`、`navigation-tree.md`（内容已并入单一 JSON；按用户确认的方案 A 直接移除）
- 样式：`src/styles/global.scss` 保持不变，新增 `element.scss` 负责主题令牌映射

## 可复用资源

- `src/styles/variables.scss`：既有设计令牌（颜色/布局/圆角/阴影/断点），直接作为 Element Plus 主题来源
- `src/api/navigation.js` 的「数据源抽象层 + `searchLinks`」结构，原样保留只换数据文件
- `docs/designs/_template/`：本方案三件套的模板

## 需同步文档

- `AGENTS.md` §2 目录映射：补充 `src/data/site-data.json`（唯一数据源）与 `src/utils/`
- 无 `docs/knowledge/` 知识库，故不涉及知识库同步
- 无 `CHANGELOG.md` / `VERIFICATION.md`，本轮不发版，不涉及

## 已知遗留（不在本次范围）

`package.json` 的校验脚本后缀错误（`.js` 实际为 `.cjs`）属于本次改动之前就存在的问题。
已在后续的 `docs/designs/2026-09-29-ci-script-fix/` 中单独修复，未混入本次改动。
