// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import { define } from './components/registry';
import * as todoNew from './components/todo-new';
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
	const itemContent = todoContent.makeSupport();

	define(todoNew.makeDefinition({
		addTodo: app.addTodo,
	}));

	define(todosView.makeDefinition({
		content: {
			render: itemContent.render,
			from: itemContent.fromContent,
			selector: itemContent.selectorRoot,
		},
		removeTodo: app.removeTodo,
		toggleTodo: app.toggleTodo,
		subscribeTodoEvent: app.subscribeTodoEvent,
	}));
}

hookupUI(assembleApp());
