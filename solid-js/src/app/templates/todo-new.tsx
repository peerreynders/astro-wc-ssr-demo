import { availableStatus, type AvailableStatus } from '../available-status';

import type { Accessor } from 'solid-js';

const MODIFIER_DISABLED = 'js:c-todo-new--disabled';
const MODIFIER_WAIT = 'js:c-todo-new--wait';

let appRef: Parameters<typeof inject>[0] | undefined;

function inject(api: {
	addTodo: (title: string) => void;
	status: Accessor<AvailableStatus>;
}) {
	if (appRef) return;
	appRef = api;
}

const newDisabled = (status: Accessor<AvailableStatus>) =>
	status() !== availableStatus.READY;

const newDisabledString = (status: Accessor<AvailableStatus>) =>
	newDisabled(status) ? 'true' : 'false';

const newDisabledClass = (status: Accessor<AvailableStatus>) =>
	newDisabled(status) ? MODIFIER_DISABLED : '';

const removeTodoClass = (status: Accessor<AvailableStatus>) => {
	let names = 'c-todo-new__submit';
	const value = status();
	if (value === availableStatus.READY) return names;

	names += ' ' + MODIFIER_DISABLED;
	return value === availableStatus.WAIT ? names + ' ' + MODIFIER_WAIT : names;
};

function TodoNew() {
	if (!appRef) throw new Error('API from App not injected yet');
	const app = appRef;

	let inputRef: HTMLInputElement | undefined;
	let submitRef: HTMLButtonElement | undefined;
	const handleEvent = (event: Event) => {
		if (event.type === 'click' && event.target === submitRef) {
			event.preventDefault();
			if (app.status() !== availableStatus.READY || !inputRef) return;

			const title = inputRef.value;
			if (title.length < 1) return;

			inputRef.value = '';
			app.addTodo(title);
			return;
		}
	};

	return (
		<form class="c-todo-new">
			<input
				ref={inputRef}
				name="todo-title"
				type="text"
				placeholder="Add a new to do"
				class={newDisabledClass(app.status)}
			/>
			<button
				ref={submitRef}
				onClick={handleEvent}
				class={removeTodoClass(app.status)}
				aria-disabled={newDisabledString(app.status)}
			>
				✅
			</button>
		</form>
	);
}

export { TodoNew, inject };
