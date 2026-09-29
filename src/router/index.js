import { createRouter, createWebHistory } from "vue-router";

const routes = [
	{
		path: "/",
		name: "home",
		component: () => import("@/views/Home.vue"),
	},
	{
		// 旧的按分类切页链接，静默落到单页内的对应锚点，避免已有收藏失效
		path: "/category/:categoryId",
		redirect: (to) => ({ path: "/", hash: `#${to.params.categoryId}` }),
	},
	{
		path: "/:pathMatch(.*)*",
		redirect: "/",
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior(to) {
		// 带 hash 的滚动由 Home.vue 自己处理：区块上设了 scroll-margin-top，
		// 用 scrollIntoView 能精确避开顶部固定导航，比在这里算偏移更可靠。
		if (to.hash) return false;
		return { top: 0 };
	},
});

export default router;
