// file: src/app/types.ts
import type { Todo } from '../types';

export type { Todo } from '../types';

export type AppProps = {
	resumeState: Todo[];
	todosApiHref: string;
};

// This wrapper object is needed because
// the resource won't reload
// if it is the same title as before
export type NewTodo = {
	title: string;
};

export type ToggleTodo = {
	id: string;
	force?: boolean;
};

export type Todos = {
	items: Todo[];
};

export type TodoActions = ReturnType<
	typeof import('./browser').makeTodoActions
>;

export type ConduitContent = Omit<
	ReturnType<typeof import('./app').makeApp>,
	'start'
>;
