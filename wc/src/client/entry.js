// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import * as todoContent from './components/todo-content';
import * as todosView from './components/todos-view';

function assembleApp() {
	const actions = makeTodoActions('/api/todos');
	return makeApp({
		addTodo: actions.addTodo,
		removeTodo: actions.removeTodo,
		toggleTodo: actions.toggleTodo,
	});
}

/**	@param { ReturnType<typeof makeApp> } app
 *	@returns { void }
 */
function hookupUI(app) {
	const itemSupport = todoContent.makeSupport();

	customElements.define(
		todosView.NAME,
		todosView.makeClass({
			content: {
				render: itemSupport.render,
				from: itemSupport.fromContent,
				selector: todoContent.SELECTOR_ROOT,
			},
			addTodo: app.addTodo,
			removeTodo: app.removeTodo,
			toggleTodo: app.toggleTodo,
			subscribeTodoEvent: app.subscribeTodoEvent,
		})
	);
}

hookupUI(assembleApp());
