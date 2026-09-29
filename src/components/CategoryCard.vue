<template>
	<el-card class="category-card" shadow="never">
		<template #header>
			<div class="category-card__header">
				<span class="category-card__icon">{{ category.icon }}</span>
				<div class="category-card__info">
					<h2 class="category-card__name">{{ category.name }}</h2>
					<p class="category-card__desc">
						{{ category.description }}
					</p>
				</div>
			</div>
		</template>

		<SubCategorySection
			v-for="sub in category.subcategories"
			:key="sub.id"
			:subcategory="sub" />
	</el-card>
</template>

<script setup>
	import SubCategorySection from "@/components/SubCategorySection.vue";

	defineProps({
		category: {
			type: Object,
			required: true,
		},
	});
</script>

<style lang="scss" scoped>
	.category-card {
		border: 1px solid $color-border-light;
		border-radius: $radius-lg;
		box-shadow: $shadow-sm;
		overflow: hidden;
	}

	:deep(.el-card__header) {
		padding: 0;
		border-bottom: 1px solid $color-border-light;
	}

	:deep(.el-card__body) {
		padding: 20px 24px;
	}

	.category-card__header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 20px 24px;
		background: linear-gradient(
			135deg,
			$color-primary-light 0%,
			$color-bg-white 100%
		);
	}

	.category-card__icon {
		font-size: 32px;
		flex-shrink: 0;
		line-height: 1;
	}

	.category-card__info {
		flex: 1;
	}

	.category-card__name {
		font-size: 18px;
		font-weight: 700;
		color: $color-text;
		margin-bottom: 4px;
	}

	.category-card__desc {
		font-size: 13px;
		color: $color-text-secondary;
		line-height: 1.5;
		margin: 0;
	}
</style>
