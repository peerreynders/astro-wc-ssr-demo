import { nanoid } from 'nanoid';

import type { APIContext, MiddlewareNext } from 'astro';

const KEY_SESSION = '__session';

function setSessionCookie(cookies: APIContext['cookies']) {
	const id = nanoid();

	// create as a session cookie (no expires or maxAge)
	cookies.set(KEY_SESSION, id, {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: true,
	});
	return id;
}

export function onRequest(context: APIContext, next: MiddlewareNext<Response>) {
	const existing = context.cookies.get(KEY_SESSION);
	context.locals.sessionId =
		existing && typeof existing.value === 'string' && existing.value.length > 0
			? existing.value
			: setSessionCookie(context.cookies);

	return next();
}
