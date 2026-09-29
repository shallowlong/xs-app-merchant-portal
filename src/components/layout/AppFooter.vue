<template>
	<footer class="app-footer">
		<div class="app-footer__inner">
			<div class="app-footer__links">
				<template
					v-for="(link, index) in siteStore.ui.footer.links"
					:key="link.id">
					<el-divider
						v-if="index > 0"
						direction="vertical"
						class="app-footer__sep" />
					<router-link
						v-if="link.kind === 'route'"
						:to="link.to"
						class="app-footer__link">
						{{ link.label }}
					</router-link>
					<el-link
						v-else
						:underline="false"
						class="app-footer__link"
						@click="openModal(link.modal)"
						>{{ link.label }}</el-link
					>
				</template>
			</div>

			<div class="app-footer__copyright">
				<p>{{ siteStore.ui.footer.notice }}</p>
				<p class="app-footer__copyright-line">
					{{ copyrightParts.before
					}}<a
						class="app-footer__copyright-link"
						:href="copyrightParts.homepage"
						target="_blank"
						rel="noopener noreferrer"
						>{{ copyrightParts.homepage }}</a
					>{{ copyrightParts.after }}
				</p>
			</div>
		</div>

		<el-dialog
			v-model="dialogVisible"
			:title="activeModal?.title"
			width="600px"
			align-center
			class="app-footer__dialog">
			<div v-if="activeModal?.sections" class="modal-sections">
				<template
					v-for="(section, index) in activeModal.sections"
					:key="index">
					<h4 class="modal-heading">{{ section.heading }}</h4>
					<p
						v-for="(paragraph, pIndex) in section.paragraphs"
						:key="pIndex"
						class="modal-paragraph">
						{{ paragraph }}
					</p>
				</template>
			</div>

			<div v-else-if="activeModal?.items" class="contact-info">
				<div
					v-for="(item, index) in activeModal.items"
					:key="index"
					class="contact-item">
					<span class="contact-label">{{ item.label }}</span>
					<span>{{ item.value }}</span>
				</div>
			</div>
		</el-dialog>
	</footer>
</template>

<script setup>
	import { computed, ref } from "vue";
	import { useSiteStore } from "@/stores/site";

	const siteStore = useSiteStore();

	/** 版权行前后两段 + 作者主页链接地址 */
	const copyrightParts = computed(() => siteStore.footerCopyrightParts);

	const activeModalKey = ref(null);

	const dialogVisible = computed({
		get: () => activeModalKey.value !== null,
		set: (visible) => {
			if (!visible) activeModalKey.value = null;
		},
	});

	const activeModal = computed(() => {
		if (!activeModalKey.value) return null;
		return siteStore.ui.footer.modals[activeModalKey.value] || null;
	});

	function openModal(modalKey) {
		activeModalKey.value = modalKey;
	}
</script>

<style lang="scss" scoped>
	.app-footer {
		background: $color-bg-white;
		border-top: 1px solid $color-border-light;
		padding: 20px 24px;

		@media (max-width: $breakpoint-md) {
			padding: 16px;
		}
	}

	.app-footer__inner {
		max-width: $content-max-width;
		margin: 0 auto;
		text-align: center;
	}

	.app-footer__links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 12px;
		flex-wrap: wrap;
		font-size: 13px;
	}

	.app-footer__link {
		color: $color-text-secondary;
		cursor: pointer;
		font-size: 13px;

		&:hover {
			color: $color-primary;
			text-decoration: underline;
		}
	}

	.app-footer__sep {
		margin: 0;
		height: 12px;
	}

	.app-footer__copyright {
		font-size: 12px;
		color: $color-text-muted;
		line-height: 1.8;

		p {
			margin: 0;
		}
	}

	.app-footer__copyright-link {
		color: inherit;

		&:hover {
			color: $color-primary;
		}
	}

	.modal-heading {
		font-size: 14px;
		font-weight: 600;
		margin: 16px 0 8px;

		&:first-child {
			margin-top: 0;
		}
	}

	.modal-paragraph {
		font-size: 13px;
		color: $color-text-secondary;
		line-height: 1.8;
		margin: 0 0 8px;
	}

	.contact-info {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.contact-item {
		font-size: 14px;
		line-height: 1.6;

		.contact-label {
			font-weight: 600;
			color: $color-text;
		}
	}
</style>
