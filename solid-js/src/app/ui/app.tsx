// file: src/app/ui/app.tsx
import { ConduitProvider } from './conduit';
import { TodoNew } from './todo-new';
import { TodoList } from './todo-list';
import type { AppProps, Todo } from '../types';

function makeResumeState(todos: Todo[]) {
	// i.e. transform the inputs to the
	// client application's initial state.
	// In this case there is nothing to do.
	return todos;
}

function App(props: AppProps) {
	return (
		<ConduitProvider {...props}>
			<TodoNew />
			<TodoList />
		</ConduitProvider>
	);
}

export { App, makeResumeState };
