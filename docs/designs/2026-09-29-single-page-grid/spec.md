# 方案：单页滚动布局 + 网格卡片 + 链接健康检查脚本

## 背景与问题

四个需求加一个数据问题：

1. 左侧栏原本是**路由切页**：点一个分类跳 `/category/:id`，一次只渲染一个分类。
   需要改成「从上到下的完整单页面」，左侧栏高亮跟随滚动位置。
2. 分类内的链接是**纵向列表**，只有名称 + 描述，看不出站点域名，也没有站点图标。
3. 没有任何手段批量检查 234 条工具链接是否还活着。
4. 页头右上角的「纺支宝首页」外链属于站点自身入口，不该占用导航位。
5. `meta` 里的 `sortOrder` 字段**从来没生效**：store 直接用数组顺序，
   所以「把货源网站排到第一」不能只改 `sortOrder`。

## 技术方案

### 1. 单页滚动 + 滚动联动高亮

- `Home.vue` 不再只渲染 `activeCategory`，而是把**所有分类顺序渲染**为
  `<section :id="category.id">`，id 直接用分类 id，天然充当锚点。
- 左侧栏点击改为**滚动到对应区块**，不再 `router.push` 切页；
  地址栏 hash 保持同步（`router.replace({ hash })`）以便分享与前进后退。
- `router.scrollBehavior` 对带 hash 的导航返回 `false`（不自己滚），
  滚动统一由页面用 `scrollIntoView` 处理 —— 区块上设了 `scroll-margin-top`，
  能精确避开 56px 的固定页头，比在 router 里算偏移更可靠。
- 旧的 `/category/:categoryId` 保留为**静默重定向**到 `/#<id>`，避免已有收藏失效。

**滚动高亮（scroll spy）** 用「触发线」判定，不用 IntersectionObserver：
取最后一个顶部已越过「页头高度 + 24px」的区块。因为各分类高度差异极大
（7 条链接 ~1 屏，63 条链接 ~4 屏），用阈值相交判断会出现大区块长时间不切换的问题。
另外补了触底兜底：最后一个区块够不到触发线时直接归到末项。

**踩坑：不要用 `requestAnimationFrame` 节流滚动处理。**
最初写成 `rAF` 里执行判定，结果在无头浏览器中 `scroll` 事件派发了、`syncActiveFromScroll`
却始终没被调用（实测 `rAF` 回调不调度），高亮完全不动。这不只是测试环境问题——
后台标签页和部分内嵌 webview 同样会节流 rAF。改为**直接同步执行**：
每次只读 8 个区块的 rect（一次批量读、不夹写），开销可忽略。

**踩坑：程序化滚动期间要暂停 spy。**
点击左栏后平滑滚动途中，高亮会依次「走」过中间所有分类，观感很跳。
故点击时给 store 打上 `scrollSpyLocked`，由 `scrollend`（外加 1200ms 超时兜底）解锁。

### 2. 网格卡片

- 新增 `LinkCard.vue` 取代 `LinkItem.vue`：卡片含 **图标 + 名称 + 网址 + 描述**，
  hover 用 `translateY(-3px)` + 阴影实现上浮，`:active` 回弹。
  描述固定两行（`-webkit-line-clamp: 2`）保证网格里卡片等高。
- 网址展示的是**主机名**而非完整 URL（完整 URL 在窄卡片里会截断成噪音）。
- 网格布局抽成全局类 `.link-grid`（4/3/2/1 列响应式），分类区块与搜索结果共用。

**网站图标（favicon）** 采用三级降级，见 `src/utils/favicon.js`：

| 级别 | 来源 | 说明 |
|---|---|---|
| 1 | `https://{host}/favicon.ico` | 零第三方依赖，失败会触发 `<img>` error，信号干净 |
| 2 | `api.xinac.net/icon/?url={host}` | 兜住没有根 favicon 的站点 |
| 3 | 名称首字色块 | 色相由名称哈希稳定推导，同一站点颜色固定 |

选型依据（本机实测，**排除了两个选项**）：

- ❌ Google `s2/favicons`、DuckDuckGo `icons.duckduckgo.com`、`api.iowen.cn`：**全部连接超时**，国内不可用。
- ❌ `favicon.im`：对不存在的域名也返回 200 + 占位 SVG（**永远不会触发兜底**），
  且实测响应 4.9s ~ 25s，不适合作为 234 条链接的主图标源。
- ✅ `api.xinac.net`：约 1s，国内可达。

### 3. 链接健康检查脚本

新增 `scripts/check-links.mjs`，对外两个命令：

```
npm run check:links         # dry-run，只出报告
npm run check:links:write   # 写回 status / url / note / meta
```

结果分 6 类，其中**只有 4 类会写回**：

| kind | 判定 | 写回 |
|---|---|---|
| `ok` | 2xx，可注册域名未变 | `status=active` |
| `wall` | 跳转或登录墙，**刻意不改 url** | `status=active` |
| `moved` | 2xx，可注册域名变化且链上有 301/308 | `status=active` + `url` + `note` |
| `dnserror` | DNS 解析失败（域名已不存在） | `status=broken` + `note` |
| `httperror` | 4xx / 5xx | ❌ 仅报告 |
| `unreachable` | 超时 / 连接失败 / TLS 失败 | ❌ 仅报告 |

**四条刻意保守的规则**（全部来自实测踩坑）：

1. **只有 DNS 解析失败才判定「失效」。** 这是最关键的一条。
   首版把「无法访问」也算失效，结果 ChatGPT、视觉中国、图虫、腾讯智影、upscayl 等
   几十个站点全被标脏 —— 它们只是**从本机连不上**（网络出口限制），工具本身有效。
   超时 / 连接失败 / 4xx / 5xx 一律只报告，交人工判断。
2. **HEAD 极不可靠。** 实测抖音、小红书、巨量云图对 HEAD 一律返回 404、GET 才 200。
   故 HEAD 只要不是 2xx 就退回 GET 复测。
3. **登录墙 / 错误页不算迁移。** 拼多多商家后台、京东商家后台、生意参谋访问时会被重定向到
   login/passport，其地址带一次性 token；回写会把有意义的后台入口换成易失效的登录地址。
4. **只有 301/308 永久跳转才算域名迁移。** 302/307 多是地域分站或临时路由：
   实测 `www.17zwd.com` 会跳到 `cs.17zwd.com`（潮汕分站，随访问地变化）。
   同时改用**可注册域名**（eTLD+1）比较而非主机名，避免把 CDN / 分站子域当成迁移。
   判定为 `moved` 时 `note` 会同时记录新旧地址，便于随时回退。

`--write` 只改**真正变化**的字段：`ok` / `wall` 保留原 `note`（多为人工备注），
只有迁移或失效才覆盖，因此写回的 diff 极小。

### 4. 移除页头外链

删除 `ui.header.navLinks` 及其渲染，页头只保留「共收录 N 个工具」。

### 5. 新增「货源网站」分类

- 置于首位（`sortOrder: 1`），存量 7 个分类 `sortOrder` 顺延 +1。
- 4 个子分类 / 共 20 个站点：综合批发平台（6）、服装垂直货源（6）、童装童品（3）、
  家纺纺织与跨境（5）。
- 前两位为用户指定：**生意网**（`www.3e3e.cn`）、**纺支宝**（`www.fangzhibao.com`）。
- 其余站点经 web 检索后**逐个实测可达性**才收录；`搜款网`（vvic.com）、
  `17货源`（17zwd.com）等检索到的域名与原猜测不同，以实测为准。
- 新链接 id 从 `lnk-215` 起续编，**不重排存量 id**，避免造成 214 条无意义 diff。

`www.fangzhibao.com` 在本机 curl 下报 TLS 证书吊销检查失败
（`CRYPT_E_REVOCATION_OFFLINE`，Windows schannel 问题而非站点问题），
Node 走自带 TLS 栈不受影响，实测可达。

### 6. 让 `sortOrder` 真正生效

`fetchCategories()` 改为逐层按 `sortOrder` 排序并返回**深拷贝**
（避免就地排序污染 JSON 模块单例）。此后「调整展示顺序」是纯数据改动。

## 影响范围

- 新增：`src/components/LinkCard.vue`、`src/utils/favicon.js`、`scripts/check-links.mjs`、本方案目录
- 删除：`src/components/LinkItem.vue`（被 LinkCard 取代）
- 改写：`src/views/Home.vue`、`src/components/layout/AppSidebar.vue`、
  `src/components/SubCategorySection.vue`、`src/components/layout/AppHeader.vue`、
  `src/router/index.js`、`src/api/site.js`、`src/stores/site.js`、`src/styles/global.scss`
- 数据：`src/data/site-data.json`（新增 category、移除 navLinks、健康检查写回 3 条链接 + meta）
- 文档：`AGENTS.md` 与 `.codebuddy/rules/AGENTS.md`（§2 目录映射、§5 验证门禁、PATH-CHECK）、
  `.agents/skills/merchant-portal-dev/SKILL.md` 及其 `.claude` 镜像

## 可复用资源

- `src/utils/format.js` 的模板插值，继续用于界面文案
- `src/styles/variables.scss` 设计令牌，LinkCard 的圆角/阴影/过渡全部取自此处
- `.link-grid` 全局类，分类区块与搜索结果共用同一套响应式断点

## 需同步文档

- 本方案目录三件套
- `AGENTS.md` §2 补 `scripts/` 行、§5 补链接检查门禁、PATH-CHECK 纳入 `scripts/`
- `SKILL.md` 同步验证门禁，并重新 `--sync` 到 `.claude` 镜像
- 无 `docs/knowledge/` 知识库，不涉及

## 已知遗留（不在本次范围）

- **26 条链接需人工确认**：17 条 HTTP 错误（多为反爬/需登录/SPA 路由）+ 10 条本机不可达
  （多为境外站点）。脚本刻意不自动改写，见 `checklist.md` 明细。
- `小旺神` 的 `note` 仍是「原链接 404，已修正为首页 URL」，但状态已恢复 `active`，
  属历史备注未清理。
- `quickLinks`（6 条快捷入口）仍被加载但无 UI 展示，未在本次接入。
