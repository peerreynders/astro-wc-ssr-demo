// file: src/app/types.ts
import { makeTodoActions } from './browser.ts';
import type { AvailableStatus } from './available-status.ts';

import type { Todo } from '../types';

export type { Todo } from '../types';

export type AppProps = {
	resumeState: Todo[];
	todosApiHref: string;
};

export type UIBound<T> = {
	get: () => Readonly<T>;
	subscribe: (flush: () => void) => () => void;
};

export type TodoActions = ReturnType<typeof makeTodoActions>;

export type ConduitContent = {
	addNewTodo: (title: string) => Promise<void>;
	items: (id: string) => UIBound<Todo>;
	removeTodo: (id: string) => Promise<void>;
	sortedIds: UIBound<string[]>;
	status: UIBound<AvailableStatus>;
	toggleTodo: (id: string, force?: boolean) => Promise<void>;
};
