// file: src/app/ui/components/todo-new.tsx
import { useRef } from 'preact/hooks';
import { availableStatus, type AvailableStatus } from '../../available-status';

const CLASS_SUBMIT = 'c-todo-new__submit';
const MODIFIER_DISABLED = 'js:c-todo-new--disabled';
const MODIFIER_WAIT = 'js:c-todo-new--wait';

function TodoNew(props: {
	addNewTodo: (title: string) => unknown;
	status: AvailableStatus;
}) {
	const newTitle = useRef<HTMLInputElement>(null);

	const submitNewTodo = (event: Event) => {
		event.preventDefault();
		const button = event.target;
		if (!(button instanceof HTMLButtonElement && newTitle.current)) return;

		const title = newTitle.current.value;
		if (title.length < 1) return;

		newTitle.current.value = '';
		props.addNewTodo(title);
	};

	const [disabledForAria, disabledAsClass, submitClass]: [
		'true' | 'false',
		string,
		string,
	] =
		props.status === availableStatus.WAIT
			? [
					'true',
					MODIFIER_DISABLED,
					`${CLASS_SUBMIT} ${MODIFIER_DISABLED} ${MODIFIER_WAIT}`,
			  ]
			: props.status !== availableStatus.READY
			  ? ['true', MODIFIER_DISABLED, `${CLASS_SUBMIT} ${MODIFIER_DISABLED}`]
			  : ['false', '', CLASS_SUBMIT];
	return (
		<form>
			<input
				ref={newTitle}
				name="todo-title"
				type="text"
				placeholder="Add a new to do"
				class={disabledAsClass}
			/>
			<button
				onClick={submitNewTodo}
				class={submitClass}
				aria-disabled={disabledForAria}
			>
				✅
			</button>
		</form>
	);
}

export { TodoNew };
