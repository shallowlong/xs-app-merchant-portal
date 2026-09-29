<template>
	<section class="subcategory-section">
		<div class="subcategory-section__header">
			<h3 class="subcategory-section__title">{{ subcategory.name }}</h3>
			<span
				v-if="subcategory.description"
				class="subcategory-section__desc"
				>{{ subcategory.description }}</span
			>
		</div>
		<el-divider class="subcategory-section__divider" />
		<div class="link-grid">
			<LinkCard
				v-for="link in subcategory.links"
				:key="link.id"
				:link="link" />
		</div>
	</section>
</template>

<script setup>
	import LinkCard from "@/components/LinkCard.vue";

	defineProps({
		subcategory: {
			type: Object,
			required: true,
		},
	});
</script>

<style lang="scss" scoped>
	.subcategory-section {
		margin-bottom: 28px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.subcategory-section__header {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 0 4px;
	}

	.subcategory-section__title {
		font-size: 15px;
		font-weight: 600;
		color: $color-text;
	}

	.subcategory-section__desc {
		font-size: 12px;
		color: $color-text-muted;
	}

	.subcategory-section__divider {
		margin: 8px 0 14px;
		border-color: $color-border-light;
	}
</style>
