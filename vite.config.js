import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const siteDataPath = fileURLToPath(
	new URL("./src/data/site-data.json", import.meta.url),
);

/**
 * 把 src/data/site-data.json 里的 SEO 字段注入 index.html。
 * 让页面标题 / description / keywords 与站内数据共用唯一事实来源。
 *
 * index.html 中书写 `%SEO_TITLE%` / `%SEO_DESCRIPTION%` / `%SEO_KEYWORDS%`，
 * order: "pre" 保证在 Vite 自身的环境变量替换之前完成，避免产生未知变量告警。
 */
function siteDataSeoPlugin() {
	return {
		name: "site-data-seo",
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				const { meta, seo } = JSON.parse(
					readFileSync(siteDataPath, "utf-8"),
				);
				const tokens = {
					SEO_TITLE: meta.siteName,
					SEO_DESCRIPTION: seo.description,
					SEO_KEYWORDS: seo.keywords,
				};
				return html.replace(/%([A-Z_]+)%/g, (raw, key) =>
					Object.prototype.hasOwnProperty.call(tokens, key)
						? tokens[key]
						: raw,
				);
			},
		},
	};
}

export default defineConfig({
	plugins: [
		vue(),
		// Element Plus 按需引入：只打包实际用到的组件与样式
		// dts: false —— 本项目为纯 JS，无需生成类型声明文件
		AutoImport({
			resolvers: [ElementPlusResolver()],
			dts: false,
		}),
		Components({
			resolvers: [ElementPlusResolver()],
			dts: false,
		}),
		siteDataSeoPlugin(),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@/styles/variables.scss" as *;`,
			},
		},
	},
	server: {
		port: 9100,
		host: true,
	},
});
