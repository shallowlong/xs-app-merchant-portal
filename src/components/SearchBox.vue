<template>
	<div class="search-box">
		<el-input
			v-model="inputValue"
			:placeholder="placeholder"
			:prefix-icon="Search"
			size="large"
			clearable
			class="search-box__input"
			@clear="onClear"
			@keydown.escape="onClear" />
	</div>
</template>

<script setup>
	import { ref, watch } from "vue";
	import { Search } from "@element-plus/icons-vue";

	const props = defineProps({
		modelValue: {
			type: String,
			default: "",
		},
		placeholder: {
			type: String,
			default: "",
		},
	});

	const emit = defineEmits(["update:modelValue", "search"]);

	const inputValue = ref(props.modelValue);

	let debounceTimer = null;

	watch(
		() => props.modelValue,
		(val) => {
			if (val !== inputValue.value) inputValue.value = val;
		},
	);

	watch(inputValue, (val) => {
		emit("update:modelValue", val);
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			emit("search", val);
		}, 300);
	});

	function onClear() {
		clearTimeout(debounceTimer);
		inputValue.value = "";
		emit("update:modelValue", "");
		emit("search", "");
	}
</script>

<style lang="scss" scoped>
	.search-box {
		margin-bottom: 24px;
	}

	:deep(.search-box__input .el-input__wrapper) {
		border-radius: $radius-md;
	}
</style>
