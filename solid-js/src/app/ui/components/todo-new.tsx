// file: src/app/ui/components/todo-new.tsx
import { availableStatus, type AvailableStatus } from '../../available-status';

import type { Accessor } from 'solid-js';

const CLASS_SUBMIT = 'c-todo-new__submit';
const MODIFIER_DISABLED = 'js:c-todo-new--disabled';
const MODIFIER_WAIT = 'js:c-todo-new--wait';

type Props = {
	addTodo: (title: string) => void;
	status: Accessor<AvailableStatus>;
};

function TodoNew(props: Props) {
	let inputRef: HTMLInputElement | undefined;
	let submitRef: HTMLButtonElement | undefined;
	const handleEvent = (event: Event) => {
		if (event.type === 'click' && event.target === submitRef) {
			event.preventDefault();
			if (props.status() !== availableStatus.READY || !inputRef) return;

			const title = inputRef.value;
			if (title.length < 1) return;

			inputRef.value = '';
			props.addTodo(title);
			return;
		}
	};

	return () => {
		const status = props.status();
		const [disabledAsString, disabledAsClass, submitClass]: [
			'true' | 'false',
			string,
			string,
		] =
			status === availableStatus.WAIT
				? [
						'true',
						MODIFIER_DISABLED,
						`${CLASS_SUBMIT} ${MODIFIER_DISABLED} ${MODIFIER_WAIT}`,
				  ]
				: status !== availableStatus.READY
				  ? ['true', MODIFIER_DISABLED, `${CLASS_SUBMIT} ${MODIFIER_DISABLED}`]
				  : ['false', '', CLASS_SUBMIT];

		return (
			<form class="c-todo-new">
				<input
					ref={inputRef}
					name="todo-title"
					type="text"
					placeholder="Add a new to do"
					class={disabledAsClass}
				/>
				<button
					ref={submitRef}
					onClick={handleEvent}
					class={submitClass}
					aria-disabled={disabledAsString}
				>
					✅
				</button>
			</form>
		);
	};
}

export { TodoNew };
