import { availableStatus, type AvailableStatus } from './available-status';
import { createEffect, createSignal, createResource } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

import type { ToggleTodo } from './types';
import type { Todo } from '../types';

function findTodoById(todos: Todo[], id: string) {
	for (let i = 0; i < todos.length; i += 1) if (todos[i].id === id) return i;

	return -1;
}

function findByIndex(todos: Todo[], index: number) {
	for (let i = todos.length - 1; i > -1; i -= 1)
		if (todos[i].index <= index) return i + 1;

	return 0;
}

function makeApp(
	actions: {
		addTodo: (title: string) => Promise<Todo>;
		removeTodo: (id: string) => Promise<string>;
		toggleTodo: (toggle: ToggleTodo) => Promise<Todo>;
	},
	initialState: Todo[]
) {
	let rawTodos = initialState;
	const [todos, setTodos] = createStore(rawTodos);

	const [status, setStatus] = createSignal<AvailableStatus>(
		availableStatus.UNAVAILABLE
	);
	const readyStatus = () => setStatus(availableStatus.READY);
	const waitStatus = () => setStatus(availableStatus.WAIT);

	const [addNew, setAddNew] = createSignal<string>();
	const [addedNew] = createResource(addNew, actions.addTodo);
	createEffect(function addNewTodo() {
		const todo = addedNew();
		if (!todo) return;

		const i = findByIndex(rawTodos, todo.index);
		rawTodos = rawTodos.toSpliced(i, 0, todo);
		setTodos(reconcile(rawTodos));
	});

	const [removeId, setRemoveId] = createSignal<string>();
	const [removedById] = createResource(removeId, actions.removeTodo);
	createEffect(function removeFromTodos() {
		const id = removedById();
		if (typeof id !== 'string') return;

		const i = findTodoById(rawTodos, id);
		if (i < 0) return;

		rawTodos = rawTodos.toSpliced(i, 1);
		setTodos(reconcile(rawTodos));
	});

	const [toggle, setToggle] = createSignal<ToggleTodo>();
	const [toggled] = createResource(toggle, actions.toggleTodo);
	createEffect(function toggleTodo() {
		const todo = toggled();
		if (!todo) return;

		const i = findTodoById(rawTodos, todo.id);
		if (i < 0 || rawTodos[i].completed === todo.completed) return;

		rawTodos[i].completed = todo.completed;
		rawTodos = rawTodos.slice();
		setTodos(reconcile(rawTodos));
	});

	createEffect(function adjustAvailableStatus() {
		if (addedNew.loading || removedById.loading || toggled.loading)
			waitStatus();
		else readyStatus();
	});

	const addTodo = (title: string) => {
		setAddNew(title);
	};

	const removeTodo = (id: string) => {
		setRemoveId(id);
	};

	const toggleTodo = (toggle: ToggleTodo) => {
		setToggle(toggle);
	};

	const start = () => {
		if (status() !== availableStatus.UNAVAILABLE) return;
		readyStatus();
	};

	return {
		todos,
		addTodo,
		removeTodo,
		toggleTodo,
		status,
		start,
	};
}
export { makeApp };
