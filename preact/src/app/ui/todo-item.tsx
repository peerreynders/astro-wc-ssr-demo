// file: src/app/ui/todo-item.tsx
import { useSyncExternalStore } from 'preact/compat';

import { useConduit } from './conduit';
import { TodoContent } from './todo-content';
import { TodoItem as Component } from './components/todo-item';

function TodoItem(props: { id: string }) {
	// Ideally the `id` would be stable after the first render
	// as the content is expected to be part of a keyed list item
	// Therefore this component should only render again when the todo changes
	// Extract dependencies needed for TodoItem Component
	const { items, removeTodo, status, toggleTodo } = useConduit();
	const available = useSyncExternalStore(status.subscribe, status.get);
	const item = items(props.id);
	const todo = useSyncExternalStore(item.subscribe, item.get);

	return (
		<Component
			renderContent={TodoContent}
			removeTodo={removeTodo}
			status={available}
			todo={todo}
			toggleTodo={toggleTodo}
		/>
	);
}

export { TodoItem };
