<template>
	<div class="home-page">
		<!-- 搜索区域 -->
		<div class="home-page__search">
			<h2 class="home-page__greeting">
				{{ siteStore.homeGreeting }}
			</h2>
			<SearchBox
				v-model="searchKeyword"
				:placeholder="siteStore.ui.home.searchPlaceholder"
				@search="onSearch" />
		</div>

		<el-alert
			v-if="siteStore.error"
			:title="siteStore.error"
			type="error"
			show-icon
			:closable="false"
			class="home-page__alert" />

		<!-- 搜索结果 -->
		<div v-if="hasSearchResults" class="home-page__results">
			<div class="search-results-header">
				<h3>{{ siteStore.searchResultTitle }}</h3>
				<el-button link type="primary" @click="onClearSearch">
					<el-icon class="search-results-clear__icon">
						<Close />
					</el-icon>
					{{ siteStore.ui.home.clearSearch }}
				</el-button>
			</div>
			<div class="link-grid">
				<LinkCard
					v-for="item in siteStore.searchResults"
					:key="item.id"
					:link="item"
					:breadcrumb="`${item.categoryName} › ${item.subcategoryName}`" />
			</div>
		</div>

		<!--
			全部分类在同一个页面里自上而下顺序渲染（不再按路由切页），
			左侧栏的高亮由滚动位置驱动，见 syncActiveFromScroll()
		-->
		<div v-else class="home-page__sections">
			<section
				v-for="category in siteStore.categories"
				:id="category.id"
				:key="category.id"
				class="home-page__section">
				<CategoryCard :category="category" />
			</section>
		</div>

		<!-- 空状态 -->
		<el-empty
			v-if="!siteStore.loading && siteStore.categories.length === 0"
			:image-size="80"
			class="home-page__empty">
			<template #image>
				<span class="empty-state__icon">{{
					siteStore.ui.home.empty.icon
				}}</span>
			</template>
			<template #description>
				<h3 class="empty-state__title">
					{{ siteStore.ui.home.empty.title }}
				</h3>
				<p class="empty-state__desc">
					{{ siteStore.ui.home.empty.description }}
				</p>
			</template>
		</el-empty>

		<!-- 加载中 -->
		<div v-if="siteStore.loading" class="home-page__loading">
			<p class="home-page__loading-text">
				{{ siteStore.ui.home.loadingText }}
			</p>
			<el-skeleton :rows="8" animated />
		</div>
	</div>
</template>

<script setup>
	import {
		computed,
		nextTick,
		onBeforeUnmount,
		onMounted,
		ref,
		watch,
	} from "vue";
	import { useRoute } from "vue-router";
	import { Close } from "@element-plus/icons-vue";
	import { useSiteStore } from "@/stores/site";
	import SearchBox from "@/components/SearchBox.vue";
	import CategoryCard from "@/components/CategoryCard.vue";
	import LinkCard from "@/components/LinkCard.vue";

	const route = useRoute();
	const siteStore = useSiteStore();

	const searchKeyword = ref("");
	const hasSearchResults = computed(
		() => siteStore.searchResults.length > 0,
	);

	/** 顶部固定导航的高度，决定 scroll spy 的触发线 */
	const headerOffset = ref(56);
	/** 首次按 URL hash 定位用瞬时滚动，之后的切换才用平滑滚动 */
	let hashResolvedOnce = false;
	let unlockTimer = null;

	function updateHeaderOffset() {
		const header = document.querySelector(".app-header-slot");
		if (header?.offsetHeight) headerOffset.value = header.offsetHeight;
	}

	/** 取所有分类区块，顺序即页面自上而下的顺序 */
	function sectionElements() {
		return document.querySelectorAll(".home-page__section");
	}

	/**
	 * 以「触发线」判定当前分类：取最后一个顶部已越过触发线的区块。
	 * 用滚动位置判定而非 IntersectionObserver，是因为各分类区块高度差异极大，
	 * 用阈值相交判断会出现大区块长时间不切换的问题。
	 */
	function syncActiveFromScroll() {
		if (siteStore.scrollSpyLocked || hasSearchResults.value) return;

		const sections = sectionElements();
		if (sections.length === 0) return;

		const triggerLine = headerOffset.value + 24;
		let current = "";
		for (const section of sections) {
			if (section.getBoundingClientRect().top <= triggerLine) {
				current = section.id;
			} else {
				break;
			}
		}

		// 触底时最后一个分类可能够不到触发线，直接归到最后一项
		const scrolledToBottom =
			window.innerHeight + window.scrollY >=
			document.documentElement.scrollHeight - 2;
		if (scrolledToBottom) current = sections[sections.length - 1].id;

		if (current && current !== siteStore.activeCategoryId) {
			siteStore.setActiveCategory(current);
		}
	}

	/**
	 * 直接同步执行，不用 requestAnimationFrame 节流。
	 * 这里每次只读 8 个区块的 rect（一次批量读，不夹写），开销可忽略；
	 * 而 rAF 在后台标签页 / 部分内嵌 webview 中会被节流甚至不调度，
	 * 会导致高亮长期不更新。
	 */
	function onScroll() {
		syncActiveFromScroll();
	}

	function unlockSpy() {
		clearTimeout(unlockTimer);
		if (!siteStore.scrollSpyLocked) return;
		siteStore.unlockScrollSpy();
		syncActiveFromScroll();
	}

	/** scrollend 在部分环境不触发，因此另有一个超时兜底 */
	function onScrollEnd() {
		unlockSpy();
	}

	function scrollToCategory(categoryId, behavior) {
		const target = document.getElementById(categoryId);
		if (!target) return;
		target.scrollIntoView({ behavior, block: "start" });
	}

	/** URL hash 与数据就绪共同决定初始定位；之后由左侧栏点击改写 hash 触发同步 */
	watch(
		[() => route.hash, () => siteStore.categories.length],
		async ([hash, count]) => {
			if (!count || !hash) return;
			const categoryId = decodeURIComponent(hash.replace(/^#/, ""));
			if (!siteStore.categories.some((c) => c.id === categoryId)) return;
			await nextTick();
			siteStore.setActiveCategory(categoryId);
			scrollToCategory(
				categoryId,
				hashResolvedOnce ? "smooth" : "auto",
			);
			hashResolvedOnce = true;
		},
		{ immediate: true },
	);

	/** 左侧栏发起程序化滚动时会上锁，解锁后再让滚动位置接管高亮 */
	watch(
		() => siteStore.scrollSpyLocked,
		(locked) => {
			if (!locked) return;
			clearTimeout(unlockTimer);
			unlockTimer = setTimeout(onScrollEnd, 1200);
		},
	);

	function onSearch(keyword) {
		siteStore.doSearch(keyword);
	}

	async function onClearSearch() {
		searchKeyword.value = "";
		siteStore.clearSearch();
		if (route.hash) {
			const categoryId = decodeURIComponent(route.hash.replace(/^#/, ""));
			await nextTick();
			scrollToCategory(categoryId, "auto");
		}
	}

	onMounted(() => {
		updateHeaderOffset();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", updateHeaderOffset);
		window.addEventListener("scrollend", onScrollEnd, { passive: true });
	});

	onBeforeUnmount(() => {
		clearTimeout(unlockTimer);
		window.removeEventListener("scroll", onScroll);
		window.removeEventListener("resize", updateHeaderOffset);
		window.removeEventListener("scrollend", onScrollEnd);
	});
</script>

<style lang="scss" scoped>
	.home-page {
		max-width: $content-max-width;
		margin: 0 auto;

		&__alert {
			margin-bottom: 16px;
		}

		&__loading {
			padding: 24px 0;
		}
	}

	.home-page__loading-text {
		margin-bottom: 16px;
		font-size: 14px;
		color: $color-text-secondary;
	}

	.home-page__greeting {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 16px;
		color: $color-text;
	}

	.home-page__section {
		/* 锚点定位时给顶部固定导航留出空间 */
		scroll-margin-top: calc(#{$header-height} + 16px);
		margin-bottom: 32px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	// ===== 搜索结果 =====
	.search-results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;

		h3 {
			font-size: 15px;
			font-weight: 500;
			color: $color-text-secondary;
		}
	}

	.search-results-clear__icon {
		margin-right: 4px;
	}

	// ===== 空状态 =====
	.empty-state__icon {
		font-size: 56px;
		line-height: 1;
	}

	.empty-state__title {
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 8px;
		color: $color-text;
	}

	.empty-state__desc {
		font-size: 14px;
		color: $color-text-secondary;
	}
</style>
