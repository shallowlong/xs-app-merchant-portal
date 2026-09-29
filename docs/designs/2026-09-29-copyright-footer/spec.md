# 方案：页脚版权信息对齐 LICENSE / package.json

## 背景与问题

以项目所有者维护的版权基准模板（其 `LICENSE` 与 `package.json`）作为版权事实来源，
核对本项目后得出结论：**法律署名已一致，缺的是页面展示**。

| 项 | 基准模板 | 本项目 | 结论 |
|---|---|---|---|
| `LICENSE` | `Copyright (c) 2025-2026 XISHU (shallowlong@gmail.com)` | 逐字节比对一致 | ✅ 无需改动 |
| `package.json` | `"author": "XISHU <shallowlong@gmail.com>"` / `"license": "MIT"` | 同 | ✅ 无需改动 |
| 页脚展示 | —— | `© 2026 电商人工具门户站. All rights reserved.` | ❌ 需改 |

页脚版权行有三处偏离：

1. **年份是动态的**：`new Date().getFullYear()` 每年产生新值，与版权声明的固定区间 `2025-2026` 不一致。
2. **把站点名当成版权人**：`电商人工具门户站` 是站点名称，不是权利人；参考文件里的法定主体是 `XISHU`，
   页面上要求展示的昵称是 **奚叔2099**，二者都与站点名无关。
3. **缺 license 标注，且表述自相矛盾**：既无 MIT 标注，又写了 `All rights reserved.`——
   该表述与 MIT 许可授予的使用权直接冲突。

## 技术方案

### 1. 数据落点

放进 **`src/data/site-data.json` 的 `ui.footer.copyright`**，不新建 `src/data/copyright.js`。
理由：本项目已确立「所有数据集中在单一 JSON」的约定（见 `2026-09-29-deps-upgrade-and-unified-data`），
新建第二个数据文件会直接破坏它。兄弟项目之所以拆文件，是因为它们的页脚要在版权行里插入链接、
并额外承载数据集署名，本项目没有这些需求。

```json
"copyright": {
  "years": "2025-2026",
  "displayName": "奚叔2099",
  "license": "MIT",
  "template": "© {years} {displayName} · {license} License"
}
```

关键取舍：

- **`displayName` 与法定主体刻意分开**：`奚叔2099` 是对外展示昵称；法定主体 `XISHU` 只存在于
  `LICENSE` / `package.json`，**不复制进本 JSON**——否则就出现了第二个事实来源，日后必然漂移。
- **只收录「页面上要展示的事实」**：年份区间来自 `LICENSE`，license 来自 `package.json`。
- **不引入作者主页链接**：两个参考文件里都没有 `homepage` 字段，不自行发明。
- 沿用本 JSON 既有的 `{key}` 占位模板约定（与 `statTemplate` / `greeting` / `categoryTooltip` 一致），
  避免把 `©` `·` `License` 这类格式文案写进组件。

### 2. 渲染

`src/stores/site.js` 的 `footerCopyright` getter 由「动态年份 + 站点名」改为读取上述结构化字段并插值。
`AppFooter.vue` **无需改动**——它本来就渲染 `{{ siteStore.footerCopyright }}`，
这正是上一轮数据集中改造的收益：改文案不必碰组件。

同时同步 `createEmptyUi()` 中的占位结构，保证数据加载完成前访问 `ui.footer.copyright` 不会抛错。

## 影响范围

- `src/data/site-data.json`：`ui.footer.copyrightTemplate` → `ui.footer.copyright` 对象
- `src/stores/site.js`：`createEmptyUi()` 的 footer 占位结构、`footerCopyright` getter
- `AppFooter.vue`：无改动
- `LICENSE`、`package.json`：已一致，无改动
- 不新增依赖，不影响产物体积

## 可复用资源

- 既有 `src/utils/format.js` 的 `formatTemplate()`，直接复用
- 既有 `ui.footer.notice` 免责段落与本改动无关，保持原样

## 需同步文档

- 本方案目录三件套
- 无 `docs/knowledge/` 知识库，不涉及知识库同步
- `LICENSE` / `package.json` 未变，不涉及发版登记

## 一处观察（未改动）

`联系我们` 弹窗展示了邮箱 `shallowlong@gmail.com`。兄弟项目 `xs-app-nte` 的约定是
「联系方式（邮箱）属于法律署名，只写在 `LICENSE` / `package.json`，不在页面展示」。
本项目把它作为**联系渠道**刻意展示，语义不同，故本次不动；若要与 nte 完全对齐需另行确认。
