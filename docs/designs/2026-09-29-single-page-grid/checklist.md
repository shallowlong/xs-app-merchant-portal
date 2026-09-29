# 验证清单：单页滚动布局 + 网格卡片 + 链接健康检查脚本

## 构建与门禁

| 项 | 状态 | 命令/证据 |
|----|------|----------|
| 全量构建 | ✅ | `npx vite build` → `✓ built in 1.13s`，1664 modules |
| CI 检查 | ✅ | `npm run check` → exit 0（spec / skill / deps 通过，kb 跳过） |
| 类型/语法诊断 | ✅ | IDE diagnostics 0 条 |

## 运行渲染回归（无头 Edge `--headless=new --dump-dom`）

| 项 | 状态 | 证据 |
|----|------|------|
| 单页顺序渲染 | ✅ | 8 个 `.home-page__section`，id 顺序 = `sourcing > ecommerce-platforms > design-creative > image-processing > video-creation > ai-tools > content-copywriting > utility-tools` |
| 货源网站置首 | ✅ | 首个区块 id = `sourcing`，侧栏首项「🏭 货源网站 20」 |
| 网格卡片 | ✅ | 234 张 `link-card`，含图标 `img` + 名称 + 主机名 + 描述 |
| 网址字段 | ✅ | 卡片渲染主机名而非整串 URL |
| 失效徽标 | ✅ | 2 张卡片带 `link-card--broken` |
| 域名迁移已生效 | ✅ | 四季星座网卡片显示 `www.sjxz.cc`；Freepik 显示 `www.magnific.com` |
| 页头外链移除 | ✅ | 渲染结果中 `纺支宝首页` 不存在，仅剩「共收录 234 个工具」 |
| 视觉确认 | ✅ | 截图核对：favicon 全部加载成功、4 列网格、hover 上浮样式生效 |

## 滚动联动（交互级，注入脚本模拟滚动 + 派发 scroll 事件）

| 项 | 状态 | 证据 |
|----|------|------|
| 初始高亮 | ✅ | 页面顶部高亮「货源网站」 |
| 滚到末个分类 | ✅ | `scrollIntoView(#utility-tools)` → 高亮「实用工具」 |
| 滚到中间分类 | ✅ | `scrollIntoView(#image-processing)` → 高亮「图片处理」 |
| 滚回首个分类 | ✅ | 高亮回到「货源网站」 |
| 触发线几何 | ✅ | headerH=56 → 触发线 80；区块 `scroll-margin-top` 落位 72（< 80，判定命中） |

> 过程中修掉一个真实缺陷：scroll spy 原先放在 `requestAnimationFrame` 里执行，
> 无头环境下 rAF 回调不调度，高亮完全不动（后台标签页 / 内嵌 webview 同理）。
> 已改为直接同步执行。

## 链接健康检查脚本

| 项 | 状态 | 证据 |
|----|------|------|
| dry-run 不改文件 | ✅ | 多轮 dry-run 后 `git diff` 无变化、`meta.healthCheckedAt` 未写入 |
| 全量探测 | ✅ | 234 条 / 并发 16 / 用时 35.0s → 正常 198、跳转未改写 7、永久迁移 2、DNS 失效 0、HTTP 错误 17、本机不可达 10 |
| `--only` 过滤 | ✅ | `--only=sourcing` 只探测 20 条 |
| 写回 diff 极小 | ✅ | `--write` 后与写回前快照 diff 共 13 行：3 条链接（2 条迁移 + 小旺神恢复 active）+ `meta` |
| 写回可追溯 | ✅ | `moved` 的 note 记录「原 <旧址> 已 301 迁移至 <新址>（探测于 …）」，可随时回退 |
| 负向用例：HEAD 假 404 | ✅ | 抖音 / 小红书 / 巨量云图（HEAD 404、GET 200）均判为正常，未误报失效 |
| 负向用例：登录墙 | ✅ | 拼多多商家后台、京东/淘宝生意参谋、达摩盘 6~8 条判为「跳转未改写」，url 保持原样 |
| 负向用例：分站跳转 | ✅ | `www.17zwd.com → cs.17zwd.com`（潮汕分站，302）未被当成域名迁移 |
| 负向用例：境外站点 | ✅ | ChatGPT、视觉中国、图虫、腾讯智影、upscayl 等从本机不可达者**未被标为失效**（仅报告） |
| JSON 往返无损 | ✅ | `JSON.stringify(JSON.parse(raw), null, "\t") + "\n"` 与原文逐字节一致 |
| 数据完整性 | ✅ | 分类 8 / 链接 234，ID 唯一；`status` 分布 active 232 / broken 2 |

### 需人工确认的 26 条（脚本刻意不自动改写）

**HTTP 错误 17 条**（绝大多数是反爬/WAF，站点本身有效）：

- 403：致设计、设计达人、PPT 世界、OUCH(icons8)、Free Vector、真人照片修复(icons8)、
  Pexels、Pixabay、WallpapersWide、视频背景抠图(unscreen)、爱给音效配乐、视觉中国
- 468（WAF 拦截）：纺支宝 —— 用户指定站点，浏览器可正常访问
- 521（Cloudflare 源站故障）：聆听音效
- 404：免费音乐搜索器（`dspjx.com`，note 已标注失效）、一键生成图表（`chartcube.alipay.com/upload`，疑为 SPA 路由变动）

**本机不可达 10 条**（多为境外站点或本站网络出口限制）：

- 店查查（`UND_ERR_CONNECT_TIMEOUT`，note 已标注疑似失效）
- 万相台无界、生意参谋(1688)、UI 中国、ChatGPT、Ymiai、Get 智能写作、
  AI 图片放大(Bigjpg)、AI 图片修复(jpghd)、在线图片压缩(tuhaokuai)

> **注意**：两次全量运行的结果会有 1~2 条浮动（如「万相台无界」一次判 `wall`、一次判
> `unreachable`），属站点间歇性可达。因为 `unreachable` / `httperror` 都不写回，
> 浮动不会污染数据；`status` 只会在确认可达时被置为 `active`，不会误置 `broken`。

| 项 | 状态 | 说明 |
|----|------|------|
| 单测 | N/A | 本仓库无测试框架；`scripts/check-links.mjs` 以正/负向实测用例替代 |
| 知识库事实核查 | ✅ | `npm run check:kb` 跳过（`docs/knowledge/` 未创建） |
| 规范引用检查 | ✅ | `npm run check:spec` 通过（PATH-CHECK 已纳入 `scripts/`） |
| 技能双副本同步 | ✅ | `npm run check:skill` 通过（SKILL.md 改动已 `--sync` 到 `.claude` 镜像） |
| 提交规范 | ☐ | Conventional Commits；按门禁**不自动提交**，改动留工作区待审查 |
