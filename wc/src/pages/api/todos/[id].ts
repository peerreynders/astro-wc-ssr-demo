// file: src/pages/api/todos/[id].ts
import { toggleTodo, removeTodo } from '../../todos-store';
import type { APIContext } from 'astro';

const failureResponse = (message: string, status = 400) =>
	new Response(JSON.stringify({ message }), { status });

async function remove(id: string, todoId: string) {
	const removed = await removeTodo(id, todoId);
	if (!removed) return failureResponse(`Todo "${todoId}" not found`, 404);

	return new Response(undefined, { status: 204 });
}

async function toggle(id: string, todoId: string, force: boolean | undefined) {
	const todo = await toggleTodo(id, todoId, force);
	console.log(force, todo);
	if (!todo) return failureResponse(`No such todo: "${todoId}"`, 404);

	return new Response(JSON.stringify(todo), { status: 200 });
}

async function POST(context: APIContext) {
	const todoId = context.params['id'];
	if (!todoId || todoId.length < 1) return failureResponse('Invalid todo ID');

	const data = await context.request.formData();
	const intent = data.get('intent');

	if (intent !== 'remove' && intent !== 'toggle')
		return failureResponse('"intent" has to be either "remove" or "toggle"');

	if (intent === 'remove') return remove(context.locals.sessionId, todoId);

	// Optional `force` field
	const force = data.get('force');
	return toggle(
		context.locals.sessionId,
		todoId,
		force === 'true' ? true : force === 'false' ? false : undefined
	);
}

export { POST };
