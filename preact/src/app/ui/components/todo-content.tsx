// file: src/app/ui/components/todo-content.tsx
import type { Todo } from '../../types';

const TodoContent = (props: { todo: Readonly<Todo> }) => (
	<label for={props.todo.id}>{props.todo.title}</label>
);

export { TodoContent };
