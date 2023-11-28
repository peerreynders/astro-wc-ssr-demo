// file: src/app/ui/todo-content.tsx
import { useSyncExternalStore } from 'preact/compat';

import { useConduit } from './conduit';
import { TodoContent as Component } from './components/todo-content';

function TodoContent(props: { id: string }) {
	// Ideally the `id` would be stable after the first render
	// as the content is expected to be part of a keyed list item
	// Therefore this component should only render again when the todo changes
	// Extract dependencies needed for TodoContent Component
	const { items } = useConduit();
	const item = items(props.id);
	const todo = useSyncExternalStore(item.subscribe, item.get);

	return <Component todo={todo} />;
}

export { TodoContent };
