// file: src/app/ui/components/todo-list.tsx
import { availableStatus, type AvailableStatus } from '../../available-status';

import type { JSX } from 'preact';

function TodoList(props: {
	ids: Readonly<string[]>;
	status: AvailableStatus;
	renderItem: (props: { id: string }) => JSX.Element;
}) {
	const [disabledForAria, disabledAsClass]: ['false' | 'true', string] =
		props.status === availableStatus.READY
			? ['false', '']
			: ['true', 'js:c-todo-list--disabled'];

	return (
		<ul class={disabledAsClass} aria-disabled={disabledForAria}>
			{props.ids.map((id) => (
				<li key={id} class="c-todo-list__item">
					<props.renderItem id={id} />
				</li>
			))}
		</ul>
	);
}

export { TodoList };
