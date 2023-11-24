import { For } from 'solid-js';
import { availableStatus, type AvailableStatus } from '../available-status';

import type { Accessor, JSX } from 'solid-js';
import type { ToggleTodo } from '../types';
import type { Todo } from '../../types';

let appRef: Parameters<typeof inject>[0] | undefined;

function inject(api: {
	removeTodo: (id: string) => void;
	toggleTodo: (toggle: ToggleTodo) => void;
	renderContent: (props: { todo: Todo }) => JSX.Element;
	status: Accessor<AvailableStatus>;
	todos: Todo[];
}) {
	if (appRef) return;
	appRef = api;
}

const todoDisabled = (status: Accessor<AvailableStatus>) =>
	status() !== availableStatus.READY;

const todoDisabledString = (status: Accessor<AvailableStatus>) =>
	todoDisabled(status) ? 'true' : 'false';

const todoDisabledClass = (status: Accessor<AvailableStatus>) =>
	todoDisabled(status) ? 'js:c-todo-list--disabled' : '';

function TodoList() {
	if (!appRef) throw new Error('API from App not injected yet');
	const app = appRef;

	// Demonstrate event delegation
	const handleEvent = (event: Event) => {
		if (event.type != 'click') return;

		if (event.target instanceof HTMLButtonElement) {
			const parent = event.target.parentElement;
			if (!parent) return;

			const checkbox = parent.querySelector('input[type="checkbox"]');
			if (!(checkbox instanceof HTMLInputElement && checkbox.id)) return;

			app.removeTodo(checkbox.id);
			return;
		}

		if (event.target instanceof HTMLInputElement) {
			const toggle = {
				id: event.target.id,
				force: event.target.checked,
			};
			app.toggleTodo(toggle);
			return;
		}
	};

	return (
		<ul
			onClick={handleEvent}
			class={todoDisabledClass(app.status)}
			aria-disabled={todoDisabledString(app.status)}
		>
			<For each={app.todos}>
				{(todo) => (
					<li class="c-todo-list__item">
						<input
							id={todo.id}
							type="checkbox"
							checked={todo.completed}
							disabled={todoDisabled(app.status)}
						/>
						{app.renderContent({ todo })}
						<button aria-disabled={todoDisabledString(app.status)}>❌</button>
					</li>
				)}
			</For>
		</ul>
	);
}

export { TodoList, inject };
