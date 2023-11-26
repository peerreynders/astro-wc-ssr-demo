// file: src/app/ui/todo-list.tsx
import { useConduit } from './conduit';
import { TodoContent } from './components/todo-content';
import { TodoList as Component } from './components/todo-list';

function TodoList() {
	const conduit = useConduit();

	return (
		<Component
			removeTodo={conduit.removeTodo}
			toggleTodo={conduit.toggleTodo}
			renderContent={TodoContent}
			status={conduit.status}
			todos={conduit.todos}
		/>
	);
}

export { TodoList };
