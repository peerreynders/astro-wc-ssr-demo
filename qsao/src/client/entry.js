// @ts-check
// file: src/client/entry.js
import { define } from './components/registry';
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import * as todosView from './components/todos-view';

function assembleApp() {
	const actions = makeTodoActions('/api/todos');
	return makeApp({
		addTodo: actions.addTodo,
		removeTodo: actions.removeTodo,
		toggleTodo: actions.toggleTodo,
	});
}

/** @param { ReturnType<typeof makeApp> } app
 * @returns { void }
 */
function hookupUI(app) {
	define(
		todosView.NAME,
		todosView.makeSpec({
			addTodo: app.addTodo,
			removeTodo: app.removeTodo,
			toggleTodo: app.toggleTodo,
			subscribeTodoEvent: app.subscribeTodoEvent,
		})
	);
}

hookupUI(assembleApp());
