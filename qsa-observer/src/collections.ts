import { z } from 'astro:content';

const todosCollection = {
	type: 'data',
	schema: z.object({
		id: z.string(),
		index: z.number().int(),
		title: z.string(),
		completed: z.boolean().default(false),
	}),
} as const;

export { todosCollection };
