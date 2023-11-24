import { randomUUID } from 'uncrypto';
import { createStorage } from 'unstorage';
import { getCollection } from 'astro:content';

import type { Todo, TodoEntry } from '../types.ts';

type TodosTable = {
	nextIndex: number;
	size: number;
	records: Record<string, Todo>;
};

function makeTodo(
	title: string,
	index: number,
	completed = false,
	id?: string
) {
	if (!id) id = randomUUID();

	return { id, title, index, completed };
}

function makeTodosTable(entries?: Todo[]) {
	const table: TodosTable = {
		nextIndex: 0,
		size: 0,
		records: {},
	};

	if (!entries || entries.length < 1) return table;

	let index = 0;
	for (const entry of entries) {
		if (index < entry.index) index = entry.index;

		const todo = makeTodo(entry.title, entry.index, entry.completed, entry.id);

		table.records[todo.id] = todo;
	}

	table.nextIndex = index + 1;
	table.size = entries.length;

	return table;
}

function append(title: string, table: TodosTable) {
	const index = table.nextIndex++;
	const todo = makeTodo(title, index);
	table.records[todo.id] = todo;
	++table.size;
	return todo;
}

function remove(todoId: string, table: TodosTable) {
	const todo = table.records[todoId];
	if (!todo) return false;

	const removed = Reflect.deleteProperty(table.records, todoId);
	if (!removed) return false;

	--table.size;
	if (table.size > 0) return true;

	table.nextIndex = 0;
	table.size = 0;
	return true;
}

function toggle(
	todoId: string,
	force: boolean | undefined,
	table: TodosTable
): [] | [todo: Todo, toggled: boolean] {
	const todo = table.records[todoId];
	if (!todo) return [];

	let completed: boolean | undefined;
	if (typeof force === 'boolean') {
		if (force === todo.completed) return [todo, false];

		completed = force;
	} else {
		completed = !todo.completed;
	}

	todo.completed = completed;
	return [todo, true];
}

const dataOnly = (entry: TodoEntry) => entry.data;
const toTodosTable = (entries: TodoEntry[]) =>
	makeTodosTable(entries.map(dataOnly));
const freshTodos = () => getCollection('todos').then(toTodosTable);

const byIndexAsc = (a: Todo, b: Todo) => a.index - b.index;

const storage = createStorage({});

async function selectTodos(id: string) {
	let table = await storage.getItem<TodosTable>(id);
	if (!table) {
		table = await freshTodos();
		await storage.setItem<TodosTable>(id, table);
	}

	const todos: Todo[] = Object.values(table.records).sort(byIndexAsc);
	return todos;
}

async function appendTodo(id: string, title: string) {
	const table = (await storage.getItem<TodosTable>(id)) ?? makeTodosTable();
	const todo = append(title, table);
	await storage.setItem<TodosTable>(id, table);
	return todo;
}

async function toggleTodo(id: string, todoId: string, force?: boolean) {
	const table = await storage.getItem<TodosTable>(id);
	if (!table) return undefined;

	const [todo, toggled] = toggle(todoId, force, table);
	if (!toggled) return todo;

	await storage.setItem<TodosTable>(id, table);
	return todo;
}

async function removeTodo(id: string, todoId: string) {
	const table = await storage.getItem<TodosTable>(id);
	if (!table) return false;

	const removed = remove(todoId, table);
	if (!removed) return false;

	await storage.setItem<TodosTable>(id, table);
	return true;
}

export { appendTodo, toggleTodo, removeTodo, selectTodos };
