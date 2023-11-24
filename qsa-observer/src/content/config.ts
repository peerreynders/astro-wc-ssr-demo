import { defineCollection } from 'astro:content';
import { todosCollection } from '../collections';

export const collections = {
	todos: defineCollection(todosCollection),
};
