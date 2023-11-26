// file: src/app/app.ts
import { availableStatus, type AvailableStatus } from './available-status';
import { createEffect, createSignal, createResource } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

import type { NewTodo, Todo, TodoActions, ToggleTodo } from './types';

function findTodoById(todos: Todo[], id: string) {
	for (let i = 0; i < todos.length; i += 1) if (todos[i].id === id) return i;

	return -1;
}

function findByIndex(todos: Todo[], index: number) {
	for (let i = todos.length - 1; i > -1; i -= 1)
		if (todos[i].index <= index) return i + 1;

	return 0;
}

function makeApp(actions: TodoActions, initialState: Todo[]) {
	let items = initialState;
	const [todos, setTodos] = createStore(items);

	const [status, setStatus] = createSignal<AvailableStatus>(
		availableStatus.UNAVAILABLE
	);
	const readyStatus = () => setStatus(availableStatus.READY);
	const waitStatus = () => setStatus(availableStatus.WAIT);

	const [addNew, setAddNew] = createSignal<NewTodo>();
	const [addedNew] = createResource(addNew, actions.addTodo);
	createEffect(function addNewTodo() {
		const todo = addedNew();
		if (!todo) return;

		const i = findByIndex(items, todo.index);
		items.splice(i, 0, todo);
		setTodos(reconcile(items));
	});

	const [removeId, setRemoveId] = createSignal<string>();
	const [removedById] = createResource(removeId, actions.removeTodo);
	createEffect(function removeFromTodos() {
		const id = removedById();
		if (typeof id !== 'string') return;

		const i = findTodoById(items, id);
		if (i < 0) return;

		items.splice(i, 1);
		setTodos(reconcile(items));
	});

	const [toggle, setToggle] = createSignal<ToggleTodo>();
	const [toggled] = createResource(toggle, actions.toggleTodo);
	createEffect(function toggleTodo() {
		const todo = toggled();
		if (!todo) return;

		const i = findTodoById(items, todo.id);
		if (i < 0 || items[i].completed === todo.completed) return;

		items[i] = todo;
		setTodos(reconcile(items));
	});

	createEffect(function adjustAvailableStatus() {
		if (addedNew.loading || removedById.loading || toggled.loading)
			waitStatus();
		else readyStatus();
	});

	const addTodo = (title: string) => {
		setAddNew({ title });
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
