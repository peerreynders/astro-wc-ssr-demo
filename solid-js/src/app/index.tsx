import { isServer } from 'solid-js/web';

import { makeTodoActions } from './browser';
import { makeApp } from './app';
import { TodoContent } from './templates/todo-content';
import { inject as todoNewInject, TodoNew } from './templates/todo-new';
import { inject as todoListInject, TodoList } from './templates/todo-list';
import type { Todo } from '../types';

function makeResumeState(todos: Todo[]) {
	// i.e. transform the inputs to the
	// client application's initial state.
	// In this case there is nothing to do.
	return todos;
}

type Props = {
	resumeState: Todo[];
	todosApiHref: string;
};

function App(props: Props) {
	const actions = makeTodoActions(props.todosApiHref);
	const app = makeApp(actions, props.resumeState);

	todoNewInject({
		addTodo: app.addTodo,
		status: app.status,
	});

	todoListInject({
		removeTodo: app.removeTodo,
		toggleTodo: app.toggleTodo,
		renderContent: TodoContent,
		status: app.status,
		todos: app.todos,
	});

	if (!isServer) {
		// let hydration finish
		setTimeout(app.start);
	}

	return (
		<>
			<TodoNew />
			<TodoList />
		</>
	);
}

export { App, makeResumeState };
