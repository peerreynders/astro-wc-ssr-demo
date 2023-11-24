// file: src/app/ui/todo-new.tsx
import { useConduit } from './conduit';
import { TodoNew as Component } from './components/todo-new';

function TodoNew() {
	const conduit = useConduit();

	return <Component addTodo={conduit.addTodo} status={conduit.status} />;
}

export { TodoNew };
