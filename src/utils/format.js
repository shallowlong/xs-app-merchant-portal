/**
 * 文案模板工具
 *
 * src/data/site-data.json 中的可插值文案统一使用 `{key}` 占位，
 * 由这里负责渲染，保证「文案只写在 JSON 里」。
 */

/**
 * 填充模板：formatTemplate("共收录 {count} 个工具", { count: 12 })
 * @param {string} template
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function formatTemplate(template, params = {}) {
	const source = typeof template === "string" ? template : "";
	return source.replace(/\{(\w+)\}/g, (token, key) =>
		Object.prototype.hasOwnProperty.call(params, key)
			? String(params[key])
			: token,
	);
}

/**
 * 按占位符把模板切成两段，用于占位处需要内嵌 HTML 标签的场景。
 * splitTemplate("共收录 {count} 个工具", "count") => ["共收录 ", " 个工具"]
 * @param {string} template
 * @param {string} key
 * @returns {[string, string]}
 */
export function splitTemplate(template, key) {
	const source = typeof template === "string" ? template : "";
	const token = `{${key}}`;
	const index = source.indexOf(token);
	if (index === -1) return [source, ""];
	return [
		source.slice(0, index),
		source.slice(index + token.length),
	];
}
