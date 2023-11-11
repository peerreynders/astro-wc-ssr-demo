// @ts-check
// file: src/client/entry.js

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
	todosView.initialize({
		addTodo: app.addTodo,
		removeTodo: app.removeTodo,
		toggleTodo: app.toggleTodo,
		subscribeTodoEvent: app.subscribeTodoEvent,
	});

	customElements.define(todosView.NAME, todosView.TodosView);
}

hookupUI(assembleApp());
