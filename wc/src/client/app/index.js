// @ts-check
// file: src/client/app/index.js
import { availableStatus } from './available-status';
import { Multicast } from '../lib/multicast.js';

/** @typedef {import('../index').Todo} Todo */

// Types implemented for UI
/** @typedef {import('../app').AvailableStatus} AvailableStatus */
/** @typedef {import('../app').SubscribeStatus} SubscribeStatus */
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
	/** @type {AvailableStatus} */
	let status = availableStatus.UNAVAILABLE;
	/** @type {Multicast<import('../app').AvailableStatus>} */
	const available = new Multicast();

	/** @type {SubscribeStatus} */
	const subscribeStatus = (sink) => {
		const unsubscribe = available.add(sink);
		sink(status);
		return unsubscribe;
	};

	const readyStatus = () => {
		status = availableStatus.READY;
		available.send(status);
	};
	const waitStatus = () => {
		status = availableStatus.WAIT;
		available.send(status);
	};

	/** @type {Multicast<import('../app').TodoEvent>} */
	const todoEvents = new Multicast();

	/** @type { AddTodo } */
	const addTodo = async (title) => {
		waitStatus();
		try {
			const todo = await platform.addTodo(title);
			todoEvents.send({ kind: 'todo-new', todo });
		} finally {
			readyStatus();
		}
	};

	/** @type { RemoveTodo } */
	const removeTodo = async (id) => {
		waitStatus();
		try {
			const removed = await platform.removeTodo(id);
			if (!removed) return;

			todoEvents.send({ kind: 'todo-remove', id });
		} finally {
			readyStatus();
		}
	};

	/** @type { ToggleTodo } */
	const toggleTodo = async (id, force) => {
		waitStatus();
		try {
			const todo = await platform.toggleTodo(id, force);
			todoEvents.send({ kind: 'todo-toggle', id, completed: todo.completed });
		} finally {
			readyStatus();
		}
	};

	const start = () => {
		if (status !== availableStatus.UNAVAILABLE) return;
		readyStatus();
	};

	return {
		addTodo,
		removeTodo,
		toggleTodo,
		start,
		subscribeTodoEvent: todoEvents.add,
		subscribeStatus,
	};
}

export { makeApp };
