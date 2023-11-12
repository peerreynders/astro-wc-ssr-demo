// @ts-check
// file: src/client/app/index.js
import { Multicast } from '../lib/multicast.js';

/** @typedef {import('../index').Todo} Todo */

// Types implemented for UI
/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').RemoveTodo} RemoveTodo */
/** @typedef {import('../app').ToggleTodo} ToggleTodo */

/** @typedef {object} Platform
 * @property {import('./types').AddTodo} addTodo
 * @property {import('./types').RemoveTodo} removeTodo
 * @property {import('./types').ToggleTodo} toggleTodo
 */

/** @param { Platform } platform
 */
function makeApp(platform) {
	/** @type {Multicast<import('../app').TodoEvent>} */
	const todoEvents = new Multicast();

	/** @type { AddTodo } */
	const addTodo = async (title) => {
		const todo = await platform.addTodo(title);
		todoEvents.send({ kind: 'todo-new', todo });
	};

	/** @type { RemoveTodo } */
	const removeTodo = async (id) => {
		const removed = await platform.removeTodo(id);
		if (!removed) return;

		todoEvents.send({ kind: 'todo-remove', id });
	};

	/** @type { ToggleTodo } */
	const toggleTodo = async (id, force) => {
		const todo = await platform.toggleTodo(id, force);
		todoEvents.send({ kind: 'todo-toggle', id, completed: todo.completed });
	};

	return {
		addTodo,
		removeTodo,
		toggleTodo,
		subscribeTodoEvent: todoEvents.add,
	};
}

export { makeApp };
