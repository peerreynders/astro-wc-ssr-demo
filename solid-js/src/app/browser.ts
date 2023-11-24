// file: src/app/browser.ts
import type { ToggleTodo } from './types';
import type { Todo } from '../types';

function makeTodoActions(href: string) {
	const todoHref = (id: string) => `${href}/${id}`;

	return {
		addTodo,
		removeTodo,
		toggleTodo,
	};

	async function addTodo(title: string) {
		const body = new FormData();
		body.append('title', title);
		const response = await fetch(href, { method: 'POST', body });
		if (!response.ok) throw new Error(`Failed to add todo: "${title}"`);

		return response.json() as Promise<Todo>;
	}

	async function removeTodo(id: string) {
		const body = new FormData();
		body.append('intent', 'remove');

		const response = await fetch(todoHref(id), { method: 'POST', body });
		const removed = response.ok;
		if (!removed) throw new Error(`Failed to remove todo: "${id}"`);

		return id;
	}

	async function toggleTodo(toggle: ToggleTodo) {
		const body = new FormData();
		body.append('intent', 'toggle');
		if (typeof toggle.force === 'boolean')
			body.append('force', String(toggle.force));

		const response = await fetch(todoHref(toggle.id), { method: 'POST', body });
		if (!response.ok) throw new Error(`Failed to toggle todo: "${toggle.id}"`);

		return response.json() as Promise<Todo>;
	}
}

export { makeTodoActions };
