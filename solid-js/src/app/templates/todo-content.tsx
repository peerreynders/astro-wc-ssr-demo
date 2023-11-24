import type { Todo } from '../../types';

type Props = {
	todo: Todo;
};

function TodoContent(props: Props) {
	return <label for={props.todo.id}>{props.todo.title}</label>;
}

export { TodoContent };
