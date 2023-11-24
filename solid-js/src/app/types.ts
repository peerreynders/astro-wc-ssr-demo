// file: src/app/types.ts
import type { JSX } from 'solid-js';
import type { Todo } from '../types';

export type { Todo } from '../types';

export type AppProps = {
	resumeState: Todo[];
	todosApiHref: string;
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
> & {
	renderTodoContent: (props: { todo: Todo }) => JSX.Element;
};
