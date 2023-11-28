// file: src/pages/api/todos/index.ts
import { appendTodo } from '../../todos-store';
import { makeDelay } from '../../../lib/delay';
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

	const todo = await appendTodo(context.locals.sessionId, title).then(
		makeDelay()
	);
	console.log(`(${context.locals.sessionId})/api/todos: new todo`, todo);
	return new Response(JSON.stringify(todo), { status: 200 });
}

export { POST };
