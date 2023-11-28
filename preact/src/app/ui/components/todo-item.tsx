// file: src/app/ui/components/todo-item.tsx
import { availableStatus, type AvailableStatus } from '../../available-status';

import type { JSX } from 'preact';
import type { Todo } from '../../types';

function TodoItem(props: {
	renderContent: (props: { id: string }) => JSX.Element;
	removeTodo: (id: string) => unknown;
	status: AvailableStatus;
	todo: Readonly<Todo>;
	toggleTodo: (id: string, force?: boolean) => unknown;
}) {
	const [disabled, disabledForAria]: [boolean, 'false' | 'true'] =
		props.status === availableStatus.READY ? [false, 'false'] : [true, 'true'];
	const remove = (_event: Event) => void props.removeTodo(props.todo.id);
	const toggle = (_event: Event) =>
		void props.toggleTodo(props.todo.id, !props.todo.completed);

	return (
		<>
			<input
				onClick={toggle}
				id={props.todo.id}
				type="checkbox"
				checked={props.todo.completed}
				disabled={disabled}
			/>
			<props.renderContent id={props.todo.id} />
			<button onClick={remove} aria-disabled={disabledForAria}>
				❌
			</button>
		</>
	);
}

export { TodoItem };
