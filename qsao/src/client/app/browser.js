// @ts-check
// file: src/client/app/browser.js

/**	@typedef { import('./types').AddTodo} AddTodo */
/**	@typedef { import('./types').RemoveTodo} RemoveTodo */
/**	@typedef { import('./types').ToggleTodo} ToggleTodo */

/** @param {string} href
 */
function makeTodoActions(href) {
	/** @param {string} id */
	const todoHref = (id) => `${href}/${id}`;

	return {
		addTodo,
		removeTodo,
		toggleTodo,
	};

	/** @type {AddTodo} */
	async function addTodo(title) {
		const body = new FormData();
		body.append('title', title);
		const response = await fetch(href, { method: 'POST', body });
		if (!response.ok) throw new Error(`Failed to add todo: "${title}"`);

		return response.json();
	}

	/** @type {RemoveTodo} */
	async function removeTodo(id) {
		const body = new FormData();
		body.append('intent', 'remove');

		const response = await fetch(todoHref(id), { method: 'POST', body });
		const removed = response.ok;
		if (!removed) throw new Error(`Failed to remove todo: "${id}"`);

		return removed;
	}

	/** @type {ToggleTodo} */
	async function toggleTodo(id, force) {
		const body = new FormData();
		body.append('intent', 'toggle');
		if (typeof force === 'boolean') body.append('force', String(force));

		const response = await fetch(todoHref(id), { method: 'POST', body });
		if (!response.ok) throw new Error(`Failed to toggle todo: "${id}"`);

		return response.json();
	}
}

export { makeTodoActions };
