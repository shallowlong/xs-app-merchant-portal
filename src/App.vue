<template>
	<el-config-provider :locale="zhCn">
		<el-container
			class="app-layout"
			:class="{ 'app-layout--loading': siteStore.loading }">
			<el-header class="app-header-slot" height="56px">
				<AppHeader />
			</el-header>

			<el-container class="app-body">
				<el-aside class="app-sidebar-slot" width="220px">
					<AppSidebar />
				</el-aside>

				<el-container class="app-content">
					<el-main class="app-main">
						<router-view />
					</el-main>
					<el-footer class="app-footer-slot" height="auto">
						<AppFooter />
					</el-footer>
				</el-container>
			</el-container>
		</el-container>
	</el-config-provider>
</template>

<script setup>
	import { onMounted } from "vue";
	import zhCn from "element-plus/es/locale/lang/zh-cn";
	import { useSiteStore } from "@/stores/site";
	import AppHeader from "@/components/layout/AppHeader.vue";
	import AppSidebar from "@/components/layout/AppSidebar.vue";
	import AppFooter from "@/components/layout/AppFooter.vue";

	const siteStore = useSiteStore();

	onMounted(() => {
		siteStore.loadData();
	});
</script>

<style lang="scss">
	.app-layout {
		min-height: 100vh;

		&--loading {
			cursor: wait;
		}
	}

	.app-header-slot {
		position: sticky;
		top: 0;
		z-index: 100;
		flex-shrink: 0;
		padding: 0;
	}

	.app-body {
		flex: 1;
		align-items: stretch;
	}

	.app-sidebar-slot {
		position: sticky;
		top: $header-height;
		height: calc(100vh - #{$header-height});
		flex-shrink: 0;
		padding: 0;
		overflow: hidden;
		background: $color-bg-sidebar;
		border-right: 1px solid $color-border-light;

		@media (max-width: $breakpoint-md) {
			display: none;
		}
	}

	.app-content {
		flex: 1;
		min-width: 0;
	}

	.app-main {
		padding: 24px;
		background-color: $color-bg;

		@media (max-width: $breakpoint-md) {
			padding: 16px;
		}
	}

	.app-footer-slot {
		height: auto;
		padding: 0;
		overflow: visible;
	}
</style>
