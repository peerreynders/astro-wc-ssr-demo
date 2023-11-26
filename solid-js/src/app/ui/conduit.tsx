// file: src/app/ui/conduit.tsx
import { createContext, useContext } from 'solid-js';
import { isServer } from 'solid-js/web';
import { makeTodoActions } from '../browser';
import { makeApp } from '../app';

import type { Context, ParentProps } from 'solid-js';
import type { AppProps, ConduitContent } from '../types';

const ConduitContext: Context<ConduitContent | undefined> = createContext();

function ConduitProvider(props: ParentProps<AppProps>) {
	const actions = makeTodoActions(props.todosApiHref);
	const app = makeApp(actions, props.resumeState);
	const conduit = {
		addTodo: app.addTodo,
		removeTodo: app.removeTodo,
		status: app.status,
		todos: app.todos,
		toggleTodo: app.toggleTodo,
	};

	if (!isServer) {
		// let hydration finish
		setTimeout(app.start);
	}

	return (
		<ConduitContext.Provider value={conduit}>
			{props.children}
		</ConduitContext.Provider>
	);
}

function useConduit() {
	const conduit = useContext(ConduitContext);
	if (!conduit) throw Error('Conduit is not instantiated yet');

	return conduit;
}

export { ConduitProvider, useConduit };
