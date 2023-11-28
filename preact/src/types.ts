import type { CollectionEntry } from 'astro:content';

export type TodoEntry = CollectionEntry<'todos'>;
export type Todo = TodoEntry['data'];
