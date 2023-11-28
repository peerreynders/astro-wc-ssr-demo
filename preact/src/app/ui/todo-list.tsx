// file: src/app/ui/todo-list.tsx
import { useSyncExternalStore } from 'preact/compat';

import { useConduit } from './conduit';
import { TodoItem } from './todo-item';
import { TodoList as Component } from './components/todo-list';

// Niladic function component;
// only runs on initial render and when external store changes (`conduit` never changes)
function TodoList() {
	// extract dependencies needed for TodoList Component
	const { sortedIds, status } = useConduit();
	const ids = useSyncExternalStore(sortedIds.subscribe, sortedIds.get);
	const available = useSyncExternalStore(status.subscribe, status.get);

	return <Component ids={ids} renderItem={TodoItem} status={available} />;
}

export { TodoList };
