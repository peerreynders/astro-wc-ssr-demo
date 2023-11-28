// file: src/app/ui/conduit.tsx
import { createContext, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';

import { makeTodoActions } from '../browser';
import { makeApp } from '../app';

import type { AppProps, ConduitContent } from '../types';

const ConduitContext = createContext<undefined | ConduitContent>(undefined);

function ConduitProvider(props: AppProps & { children?: ComponentChildren }) {
	const actions = makeTodoActions(props.todosApiHref);
	const app = makeApp(actions, props.resumeState);

	const conduit = {
		addNewTodo: app.addNewTodo,
		items: app.items,
		removeTodo: app.removeTodo,
		sortedIds: app.sortedIds,
		status: app.status,
		toggleTodo: app.toggleTodo,
	};

	if (typeof window !== 'undefined') {
		// let synchronous execution finish first
		// before enabling everything
		queueMicrotask(app.start);
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
