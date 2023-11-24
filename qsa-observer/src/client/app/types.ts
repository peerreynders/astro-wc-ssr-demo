// file: src/client/app/type.ts
import type { Todo } from '../index';

// types app.js expects dependencies to implement
export type AddTodo = (title: string) => Promise<Todo>;
export type RemoveTodo = (id: string) => Promise<boolean>;
export type ToggleTodo = (id: string, force?: boolean) => Promise<Todo>;
