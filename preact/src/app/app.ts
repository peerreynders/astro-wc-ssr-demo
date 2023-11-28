// file: src/app/app.ts
import { Multicast } from './lib/multicast';
import { availableStatus, type AvailableStatus } from './available-status';

import type { Todo, TodoActions, UIBound } from './types';

class Item {
	cast: Multicast;

	constructor(public todo: Todo) {
		this.cast = new Multicast();
		this.todo = todo;
	}

	replace(todo: Todo) {
		this.todo = todo;
		this.cast.send();
	}

	forUI: UIBound<Todo> = {
		// these functions need to work without the object reference
		get: () => this.todo,

		subscribe: (flush: () => void) => {
			const unsubscribe = this.cast.add(flush);
			return unsubscribe;
		},
	};
}

function makeApp(actions: TodoActions, initialState: Todo[]) {
	// Available status
	let status: AvailableStatus = availableStatus.UNAVAILABLE;
	const statuscast = new Multicast();
	const statusUI: UIBound<AvailableStatus> = {
		get: () => status,
		subscribe: (flush: () => void) => {
			const unsubscribe = statuscast.add(flush);
			return unsubscribe;
		},
	};

	const readyStatus = () => {
		status = availableStatus.READY;
		statuscast.send();
	};
	const waitStatus = () => {
		status = availableStatus.WAIT;
		statuscast.send();
	};

	// Todo list
	const items = new Map<string, Item>();
	const itemsUI = (id: string) => {
		const item = items.get(id);
		if (!item) throw new Error(`Can't find todo ${id}`);
		return item.forUI;
	};

	let sortedIds: string[] = [];
	const sortedIdscast = new Multicast();
	const sortedIdsUI: UIBound<string[]> = {
		get: () => sortedIds,
		subscribe: (flush: () => void) => {
			const unsubscribe = sortedIdscast.add(flush);
			return unsubscribe;
		},
	};

	const sortByIndex = (idA: string, idB: string) => {
		const itemA = items.get(idA);
		const itemB = items.get(idB);
		if (!(itemA && itemB))
			throw new Error(
				'Comparing Todo by Index Error a:${idA} ${itemA} b:${idB} ${itemB}'
			);
		return itemA.todo.index - itemB.todo.index;
	};

	const refreshSortedIds = () => {
		sortedIds = Array.from(items.values(), (item) => item.todo.id).sort(
			sortByIndex
		);
		sortedIdscast.send();
	};

	// Load items from initialState
	for (const todo of initialState) {
		sortedIds.push(todo.id);
		items.set(todo.id, new Item(todo));
	}

	// actions
	const addNewTodo = async (title: string) => {
		waitStatus();
		try {
			const todo = await actions.addTodo(title);

			items.set(todo.id, new Item(todo));
			refreshSortedIds();
		} finally {
			readyStatus();
		}
	};

	const removeTodo = async (id: string) => {
		waitStatus();
		try {
			const removed = await actions.removeTodo(id);
			if (!removed) return;

			items.delete(id);
			refreshSortedIds();
		} finally {
			readyStatus();
		}
	};

	const toggleTodo = async (id: string, force?: boolean) => {
		waitStatus();
		try {
			const todo = await actions.toggleTodo(id, force);
			const item = items.get(todo.id);
			if (!item) throw new Error('Unable to find toggled todo ${todo.id}');
			item.replace(todo);
		} finally {
			readyStatus();
		}
	};

	const start = () => {
		readyStatus();
	};

	return {
		addNewTodo,
		items: itemsUI,
		removeTodo,
		sortedIds: sortedIdsUI,
		start,
		status: statusUI,
		toggleTodo,
	};
}

export { makeApp };
