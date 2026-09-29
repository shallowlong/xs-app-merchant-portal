<template>
	<header class="app-header">
		<div class="app-header__inner">
			<router-link to="/" class="app-header__logo">
				<span class="app-header__logo-icon">{{
					siteStore.ui.header.logoIcon
				}}</span>
				<div class="app-header__logo-text">
					<h1 class="app-header__title">
						{{ siteStore.meta.siteName }}
					</h1>
					<span class="app-header__subtitle">{{
						siteStore.meta.siteSubtitle
					}}</span>
				</div>
			</router-link>

			<nav class="app-header__nav">
				<span class="app-header__nav-info">
					{{ statParts[0]
					}}<strong>{{ siteStore.totalLinks }}</strong
					>{{ statParts[1] }}
				</span>
			</nav>
		</div>
	</header>
</template>

<script setup>
	import { computed } from "vue";
	import { useSiteStore } from "@/stores/site";
	import { splitTemplate } from "@/utils/format";

	const siteStore = useSiteStore();

	/** 把原始模板按 {count} 切开，便于在数字处套 <strong> */
	const statParts = computed(() =>
		splitTemplate(siteStore.ui.header.statTemplate, "count"),
	);
</script>

<style lang="scss" scoped>
	.app-header {
		height: $header-height;
		background: $color-bg-white;
		border-bottom: 1px solid $color-border;
		box-shadow: $shadow-sm;
	}

	.app-header__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		padding: 0 24px;
		max-width: 100%;
	}

	.app-header__logo {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: $color-text;

		&:hover {
			text-decoration: none;
		}
	}

	.app-header__logo-icon {
		font-size: 28px;
	}

	.app-header__logo-text {
		display: flex;
		flex-direction: column;
	}

	.app-header__title {
		font-size: 16px;
		font-weight: 700;
		line-height: 1.2;
	}

	.app-header__subtitle {
		font-size: 11px;
		color: $color-text-secondary;
		line-height: 1;
	}

	.app-header__nav {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 13px;
		color: $color-text-secondary;
	}

	.app-header__nav-info strong {
		color: $color-accent;
		font-weight: 600;
	}

	// 窄屏隐藏右侧统计与入口，避免与标题挤压
	@media (max-width: $breakpoint-sm) {
		.app-header__nav {
			display: none;
		}
	}
</style>
