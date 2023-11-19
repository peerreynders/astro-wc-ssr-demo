// import type { CollectionEntry } from 'astro:content';

// type TodoEntry = CollectionEntry<'todos'>;
// export type Todo = TodoEntry['data'];

export type Todo = {
	id: string;
	title: string;
	index: number;
	completed: boolean;
};
