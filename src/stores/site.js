import { defineStore } from "pinia";
import {
	fetchCategories,
	fetchMeta,
	fetchQuickLinks,
	fetchUi,
	searchLinks,
} from "@/api/site";
import { formatTemplate, splitTemplate } from "@/utils/format";

/** 数据加载完成前的占位结构，保证模板随时可访问而不报错 */
function createEmptyUi() {
	return {
		header: { logoIcon: "", statTemplate: "" },
		sidebar: { sectionTitle: "", footerText: "", categoryTooltip: "" },
		home: {
			greeting: "",
			searchPlaceholder: "",
			searchResultTitle: "",
			clearSearch: "",
			loadingText: "",
			empty: { icon: "", title: "", description: "" },
		},
		labels: { brokenBadge: "", errorText: "" },
		footer: {
			links: [],
			notice: "",
			copyright: {
				years: "",
				displayName: "",
				homepage: "",
				license: "",
				template: "",
			},
			modals: {},
		},
	};
}

/** 兜底错误文案：仅在 site-data.json 本身加载失败时使用 */
const FALLBACK_ERROR_TEXT = "数据加载失败，请稍后重试";

export const useSiteStore = defineStore("site", {
	state: () => ({
		meta: { siteName: "", siteSubtitle: "" },
		ui: createEmptyUi(),
		categories: [],
		quickLinks: [],
		activeCategoryId: null,
		searchKeyword: "",
		searchResults: [],
		loading: false,
		error: null,
		/**
		 * 程序化滚动（点击左侧栏）期间暂停 scroll spy，
		 * 否则高亮会跟着滚动过程一路「走」过中间的分类，观感很跳。
		 */
		scrollSpyLocked: false,
	}),

	getters: {
		activeCategory(state) {
			if (!state.categories.length) return null;
			return (
				state.categories.find((c) => c.id === state.activeCategoryId) ||
				state.categories[0]
			);
		},

		sidebarCategories(state) {
			return state.categories.map((c) => ({
				id: c.id,
				name: c.name,
				icon: c.icon,
				count: (c.subcategories || []).reduce(
					(sum, s) => sum + (s.links || []).length,
					0,
				),
			}));
		},

		totalLinks(state) {
			return state.categories.reduce(
				(sum, cat) =>
					sum +
					(cat.subcategories || []).reduce(
						(s, sub) => s + (sub.links || []).length,
						0,
					),
				0,
			);
		},

		/** 通用标签文案（失效徽标、错误提示等） */
		labels() {
			return this.ui.labels;
		},

		/** 「共收录 N 个工具」 */
		headerStat() {
			return formatTemplate(this.ui.header.statTemplate, {
				count: this.totalLinks,
			});
		},

		/** 「发现 N 个电商运营工具」 */
		homeGreeting() {
			return formatTemplate(this.ui.home.greeting, {
				count: this.totalLinks,
			});
		},

		/** 「搜索 "xx" 共找到 N 个结果」 */
		searchResultTitle() {
			return formatTemplate(this.ui.home.searchResultTitle, {
				keyword: this.searchKeyword,
				count: this.searchResults.length,
			});
		},

		/**
		 * 页脚版权行。
		 *
		 * 模板里 {homepage} 的位置需要渲染成超链接，因此按该占位符把模板切成
		 * 前后两段分别插值，组件在中间放 `<a>`。
		 * 年份区间与 license 对齐仓库根 LICENSE / package.json；
		 * displayName 是**对外展示用昵称**，与 LICENSE 中的法定署名主体刻意区分。
		 */
		footerCopyrightParts() {
			const { template, years, displayName, homepage, license } =
				this.ui.footer.copyright;
			const params = { years, displayName, license };
			const [before, after] = splitTemplate(template, "homepage");
			return {
				before: formatTemplate(before, params),
				after: formatTemplate(after, params),
				homepage,
			};
		},
	},

	actions: {
		async loadData() {
			this.loading = true;
			this.error = null;
			try {
				const [meta, ui, categories, quickLinks] = await Promise.all([
					fetchMeta(),
					fetchUi(),
					fetchCategories(),
					fetchQuickLinks(),
				]);
				this.meta = meta;
				this.ui = ui;
				this.categories = categories;
				this.quickLinks = quickLinks;
				if (!this.activeCategoryId && categories.length > 0) {
					this.activeCategoryId = categories[0].id;
				}
			} catch (e) {
				this.error = this.ui?.labels?.errorText || FALLBACK_ERROR_TEXT;
				console.error("Site store load error:", e);
			} finally {
				this.loading = false;
			}
		},

		setActiveCategory(categoryId) {
			if (this.categories.some((c) => c.id === categoryId)) {
				this.activeCategoryId = categoryId;
			}
		},

		/** 点击左侧栏发起程序化滚动时调用，滚动结束后由 Home.vue 解锁 */
		lockScrollSpy() {
			this.scrollSpyLocked = true;
		},

		unlockScrollSpy() {
			this.scrollSpyLocked = false;
		},

		async doSearch(keyword) {
			this.searchKeyword = keyword;
			if (!keyword.trim()) {
				this.searchResults = [];
				return;
			}
			this.searchResults = await searchLinks(keyword.trim());
		},

		clearSearch() {
			this.searchKeyword = "";
			this.searchResults = [];
		},
	},
});
