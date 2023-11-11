// file: src/client/app.ts
import type { Todo } from './index';

// app-to-UI types (UI-bound)
export type TodoEvent = Readonly<
	| {
			kind: 'todo-new';
			todo: Readonly<Todo>;
	  }
	| {
			kind: 'todo-delete';
			id: Todo['id'];
	  }
	| {
			kind: 'todo-toggle';
			id: Todo['id'];
			completed: Todo['completed'];
	  }
>;

export type TodoNext = (event: TodoEvent) => void;
export type SubscribeTodoEvent = (next: TodoNext) => () => void;

// app-bound
export type AddTodo = (title: string) => Promise<void>;
export type RemoveTodo = (id: string) => Promise<void>;
export type ToggleTodo = (id: string, force?: boolean) => Promise<void>;
