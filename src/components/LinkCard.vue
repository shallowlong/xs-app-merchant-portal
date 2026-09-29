<template>
	<a
		class="link-card"
		:class="{ 'link-card--broken': isBroken }"
		:href="link.url"
		target="_blank"
		rel="noopener noreferrer"
		:title="link.description || link.name">
		<div class="link-card__icon">
			<img
				v-if="iconSrc"
				class="link-card__icon-img"
				:src="iconSrc"
				alt=""
				loading="lazy"
				decoding="async"
				referrerpolicy="no-referrer"
				@error="onIconError" />
			<span v-else class="link-card__initial" :style="initialStyle">{{
				initial
			}}</span>
		</div>

		<div class="link-card__body">
			<div class="link-card__head">
				<span class="link-card__name">{{ link.name }}</span>
				<el-tag
					v-if="isBroken"
					size="small"
					type="warning"
					effect="plain"
					>{{ siteStore.labels.brokenBadge }}</el-tag
				>
			</div>
			<span class="link-card__host">{{ host }}</span>
			<span v-if="link.description" class="link-card__desc">{{
				link.description
			}}</span>
			<span v-if="breadcrumb" class="link-card__breadcrumb">{{
				breadcrumb
			}}</span>
		</div>
	</a>
</template>

<script setup>
	import { computed, ref, watch } from "vue";
	import { useSiteStore } from "@/stores/site";
	import { faviconSources, hostOf, hueOf, initialOf } from "@/utils/favicon";

	const props = defineProps({
		link: {
			type: Object,
			required: true,
		},
		/** 搜索结果里用来显示「分类 › 子分类」归属 */
		breadcrumb: {
			type: String,
			default: "",
		},
	});

	const siteStore = useSiteStore();

	const isBroken = computed(() => props.link.status === "broken");
	const host = computed(() => hostOf(props.link.url));
	const initial = computed(() => initialOf(props.link.name));
	const initialStyle = computed(() => ({
		backgroundColor: `hsl(${hueOf(props.link.name)}, 52%, 54%)`,
	}));

	/** 图标候选列表，逐个失败就往后走，走完则退回首字色块 */
	const sources = computed(() => faviconSources(props.link.url));
	const sourceIndex = ref(0);
	const iconSrc = computed(() => sources.value[sourceIndex.value] || "");

	watch(
		() => props.link.url,
		() => {
			sourceIndex.value = 0;
		},
	);

	function onIconError() {
		sourceIndex.value += 1;
	}
</script>

<style lang="scss" scoped>
	.link-card {
		display: flex;
		gap: 12px;
		padding: 14px;
		background: $color-bg-white;
		border: 1px solid $color-border-light;
		border-radius: $radius-md;
		text-decoration: none;
		color: $color-text;
		transition:
			transform $transition-fast,
			box-shadow $transition-fast,
			border-color $transition-fast;

		&:hover {
			transform: translateY(-3px);
			border-color: $color-primary-light;
			box-shadow: $shadow-md;
			text-decoration: none;

			.link-card__name {
				color: $color-primary-dark;
			}
		}

		&:active {
			transform: translateY(-1px);
			box-shadow: $shadow-sm;
		}

		&--broken {
			opacity: 0.66;
		}
	}

	.link-card__icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: $radius-sm;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $color-bg;
	}

	.link-card__icon-img {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.link-card__initial {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		font-weight: 600;
		color: #fff;
	}

	.link-card__body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.link-card__head {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.link-card__name {
		font-size: 14px;
		font-weight: 600;
		color: $color-text-link;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color $transition-fast;
	}

	.link-card__host {
		font-size: 11px;
		color: $color-text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.link-card__desc {
		font-size: 12px;
		color: $color-text-secondary;
		line-height: 1.4;
		/* 固定两行，保证网格里卡片高度一致 */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.link-card__breadcrumb {
		font-size: 11px;
		color: $color-text-muted;
	}
</style>
