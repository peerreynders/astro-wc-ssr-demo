// file: src/app/ui/components/todo-list.tsx
import { For } from 'solid-js';
import { availableStatus, type AvailableStatus } from '../../available-status';

import type { Accessor, JSX } from 'solid-js';
import type { Todo, ToggleTodo } from '../../types';

type Props = {
	removeTodo: (id: string) => void;
	toggleTodo: (toggle: ToggleTodo) => void;
	renderContent: (props: { todo: Todo }) => JSX.Element;
	status: Accessor<AvailableStatus>;
	todos: Todo[];
};

function TodoList(props: Props) {
	// Demonstrate event delegation
	const handleEvent = (event: Event) => {
		if (event.type != 'click') return;

		if (event.target instanceof HTMLButtonElement) {
			const parent = event.target.parentElement;
			if (!parent) return;

			const checkbox = parent.querySelector('input[type="checkbox"]');
			if (!(checkbox instanceof HTMLInputElement && checkbox.id)) return;

			props.removeTodo(checkbox.id);
			return;
		}

		if (event.target instanceof HTMLInputElement) {
			const toggle = {
				id: event.target.id,
				force: event.target.checked,
			};
			props.toggleTodo(toggle);
			return;
		}
	};

	return () => {
		const [disabled, disabledAsString, disabledAsClass]: [
			boolean,
			'true' | 'false',
			string,
		] =
			props.status() !== availableStatus.READY
				? [true, 'true', 'js:c-todo-list--disabled']
				: [false, 'false', ''];

		return (
			<ul
				onClick={handleEvent}
				class={disabledAsClass}
				aria-disabled={disabledAsString}
			>
				<For each={props.todos}>
					{(todo) => (
						<li class="c-todo-list__item">
							<input
								id={todo.id}
								type="checkbox"
								checked={todo.completed}
								disabled={disabled}
							/>
							{props.renderContent({ todo })}
							<button aria-disabled={disabledAsString}>❌</button>
						</li>
					)}
				</For>
			</ul>
		);
	};
}

export { TodoList };
