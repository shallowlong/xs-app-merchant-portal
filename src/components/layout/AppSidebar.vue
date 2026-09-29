<template>
	<aside class="app-sidebar">
		<el-scrollbar class="app-sidebar__scroll">
			<div class="app-sidebar__inner">
				<div class="app-sidebar__section-title">
					{{ siteStore.ui.sidebar.sectionTitle }}
				</div>

				<el-menu
					:default-active="siteStore.activeCategoryId || ''"
					class="app-sidebar__menu"
					@select="selectCategory">
					<el-menu-item
						v-for="cat in siteStore.sidebarCategories"
						:key="cat.id"
						:index="cat.id"
						:title="categoryTooltip(cat)">
						<span class="app-sidebar__item-icon">{{
							cat.icon
						}}</span>
						<span class="app-sidebar__item-name">{{
							cat.name
						}}</span>
						<el-tag
							size="small"
							round
							effect="plain"
							class="app-sidebar__item-badge"
							>{{ cat.count }}</el-tag
						>
					</el-menu-item>
				</el-menu>

				<div class="app-sidebar__footer">
					<span class="app-sidebar__footer-text">{{
						siteStore.ui.sidebar.footerText
					}}</span>
				</div>
			</div>
		</el-scrollbar>
	</aside>
</template>

<script setup>
	import { nextTick } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { useSiteStore } from "@/stores/site";
	import { formatTemplate } from "@/utils/format";

	const route = useRoute();
	const router = useRouter();
	const siteStore = useSiteStore();

	function categoryTooltip(category) {
		return formatTemplate(siteStore.ui.sidebar.categoryTooltip, {
			name: category.name,
			count: category.count,
		});
	}

	/**
	 * 单页模式下点击左侧栏只做「滚动到对应区块」，不再切路由。
	 *
	 * 地址栏 hash 始终保持同步（便于分享/前进后退）：
	 * hash 变化时由 Home.vue 的 watcher 负责滚动；hash 未变（已在同一锚点）
	 * 时 router 不会触发导航，这里手动滚一次。
	 */
	async function selectCategory(categoryId) {
		siteStore.setActiveCategory(categoryId);
		siteStore.clearSearch();
		siteStore.lockScrollSpy();

		const hash = `#${categoryId}`;
		if (route.hash !== hash) {
			router.replace({ path: "/", hash });
			return;
		}

		await nextTick();
		document
			.getElementById(categoryId)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}
</script>

<style lang="scss" scoped>
	.app-sidebar {
		height: 100%;
	}

	.app-sidebar__scroll {
		height: 100%;
	}

	.app-sidebar__inner {
		padding: 16px 0;
	}

	.app-sidebar__section-title {
		padding: 0 16px 12px;
		font-size: 12px;
		font-weight: 600;
		color: $color-text-muted;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.app-sidebar__menu {
		border-right: none;

		--el-menu-item-height: 40px;
		--el-menu-item-font-size: 13px;
		--el-menu-active-color: #{$color-primary};
		--el-menu-hover-bg-color: #{$color-primary-light};
		--el-menu-base-level-padding: 16px;
	}

	.app-sidebar__item-icon {
		margin-right: 10px;
		font-size: 16px;
		line-height: 1;
	}

	.app-sidebar__item-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.app-sidebar__item-badge {
		margin-left: 8px;
		flex-shrink: 0;
	}

	:deep(.el-menu-item) {
		border-left: 3px solid transparent;

		&.is-active {
			border-left-color: $color-primary;
			font-weight: 600;
			background: $color-primary-light;
		}
	}

	.app-sidebar__footer {
		margin-top: 32px;
		padding: 16px;
		text-align: center;
	}

	.app-sidebar__footer-text {
		font-size: 11px;
		color: $color-text-muted;
	}
</style>
