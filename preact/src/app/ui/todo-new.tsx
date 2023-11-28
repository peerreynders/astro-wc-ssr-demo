// file: src/app/ui/todo-new.tsx
import { useSyncExternalStore } from 'preact/compat';

import { useConduit } from './conduit';
import { TodoNew as Component } from './components/todo-new';

// Niladic function component;
// only runs on initial render and when external store changes (`conduit` never changes)
function TodoNew() {
	// Extract dependencies needed for TodoNew Component
	const { addNewTodo, status } = useConduit();
	const available = useSyncExternalStore(status.subscribe, status.get);

	return <Component addNewTodo={addNewTodo} status={available} />;
}

export { TodoNew };
