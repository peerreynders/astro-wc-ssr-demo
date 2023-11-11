// file: src/pages/api/todos/index.ts
import { appendTodo } from '../../todos-store';
import type { APIContext } from 'astro';

async function POST(context: APIContext) {
	const data = await context.request.formData();
	const title = data.get('title');
	if (typeof title !== 'string' || title.length < 1) {
		return new Response(
			JSON.stringify({
				message: 'A "title" string is required',
			}),
			{ status: 400 }
		);
	}

	const todo = await appendTodo(context.locals.sessionId, title);
	return new Response(JSON.stringify(todo), { status: 200 });
}

export { POST };
