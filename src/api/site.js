/**
 * 数据源抽象层
 *
 * 全站唯一事实来源：`src/data/site-data.json`
 * （站点元信息 / SEO / 全部界面文案 / 分类与链接 / 快捷入口）
 *
 * 组件与 store 只通过本文件读数据；后续要换成远程接口时，
 * 只需把下面的实现替换为 fetch，调用方无需改动。
 */

import siteData from "@/data/site-data.json";

/**
 * 获取整份站点数据
 * @returns {Promise<Object>}
 */
export async function fetchSiteData() {
	// TODO: 替换为 API 调用
	// const res = await fetch('/api/site')
	// return res.json()
	return siteData;
}

/**
 * 获取站点元信息
 * @returns {Promise<Object>}
 */
export async function fetchMeta() {
	const data = await fetchSiteData();
	return data.meta;
}

/**
 * 获取全部界面文案（header / sidebar / home / footer / labels）
 * @returns {Promise<Object>}
 */
export async function fetchUi() {
	const data = await fetchSiteData();
	return data.ui;
}

/** 按 sortOrder 升序，缺省视为 0，稳定排序 */
function bySortOrder(a, b) {
	return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

/**
 * 获取所有分类（含子分类和链接），按 sortOrder 逐层排好序。
 *
 * 数据文件里 sortOrder 是排序的**唯一事实来源**，这里统一排序并返回深拷贝，
 * 让「调整展示顺序」变成纯数据改动，同时避免就地排序污染 JSON 模块单例。
 * @returns {Promise<Array>}
 */
export async function fetchCategories() {
	const data = await fetchSiteData();
	return [...data.categories]
		.sort(bySortOrder)
		.map((category) => ({
			...category,
			subcategories: [...(category.subcategories || [])]
				.sort(bySortOrder)
				.map((sub) => ({
					...sub,
					links: [...(sub.links || [])].sort(bySortOrder),
				})),
		}));
}

/**
 * 获取快捷链接
 * @returns {Promise<Array>}
 */
export async function fetchQuickLinks() {
	const data = await fetchSiteData();
	return data.quickLinks;
}

/**
 * 根据分类 ID 获取分类数据
 * @param {string} categoryId
 * @returns {Promise<Object|null>}
 */
export async function fetchCategoryById(categoryId) {
	const categories = await fetchCategories();
	return categories.find((c) => c.id === categoryId) || null;
}

/**
 * 搜索链接（按名称、描述、标签匹配）
 * @param {string} keyword
 * @returns {Promise<Array>}
 */
export async function searchLinks(keyword) {
	const categories = await fetchCategories();
	const results = [];
	const kw = keyword.toLowerCase();

	for (const cat of categories) {
		for (const sub of cat.subcategories || []) {
			for (const link of sub.links || []) {
				const matched =
					link.name.toLowerCase().includes(kw) ||
					(link.description || "").toLowerCase().includes(kw) ||
					(link.tags || []).some((t) =>
						t.toLowerCase().includes(kw),
					);
				if (matched) {
					results.push({
						...link,
						subcategoryName: sub.name,
						subcategoryId: sub.id,
						categoryName: cat.name,
						categoryId: cat.id,
						categoryIcon: cat.icon,
					});
				}
			}
		}
	}

	return results;
}
