// @ts-check
// file: src/client/components/todo-list.js
import { availableStatus } from '../app/available-status';

/** @typedef { import('../types').QsaoSpec } Spec */

/** @typedef {import('../index').Todo} Todo */
/** @typedef {import('../app').AvailableStatus} AvailableStatus */
/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').RemoveTodo} RemoveTodo */
/** @typedef {import('../app').ToggleTodo} ToggleTodo */
/** @typedef {import('../app').TodoEvent} TodoEvent */
/** @typedef {import('../app').SubscribeStatus} SubscribeStatus */
/** @typedef {import('../app').SubscribeTodoEvent} SubscribeTodoEvent */
/** @typedef {import('../types').FromTodoContent} FromTodoContent */

const SELECTOR_ROOT = '.js\\:c-todo-list';
const TEMPLATE_ITEM_ID = 'template-todo-item';
const SELECTOR_CHECKBOX = 'input[type=checkbox]';
const SELECTOR_REMOVE = 'button';
const MODIFIER_DISABLED = 'js:c-todo-list--disabled';

/** @returns {() => HTMLLIElement} */
function makeCloneBlankItem() {
	const template = document.getElementById(TEMPLATE_ITEM_ID);
	if (!(template instanceof HTMLTemplateElement))
		throw Error(`${TEMPLATE_ITEM_ID} template not found`);

	const root = template.content.firstElementChild;
	if (!(root instanceof HTMLLIElement))
		throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

	// Turn off aria-disabled
	const element = root.querySelector('[aria-disabled="true"]');
	if (element) element.setAttribute('aria-disabled', 'false');

	return function cloneBlankItem() {
		return /** @type {HTMLLIElement} */ (root.cloneNode(true));
	};
}

/**	@typedef {object} ItemBinder
 *	@property {HTMLLIElement} root
 *	@property {HTMLInputElement} completed
 *	@property {HTMLButtonElement} remove
 *	@property {string} id
 *	@property {number} index
 */

/** @typedef {ItemBinder[]} ItemCollection */
/* Note keep sorted by ascending index property */

/**	@param {ItemBinder['root']} root
 *	@param {ItemBinder['completed']} completed
 *	@param {ItemBinder['remove']} remove
 *	@param {ItemBinder['id']} id
 *	@param {ItemBinder['index']} index
 */
const makeItemBinder = (root, completed, remove, id, index) => ({
	root,
	completed,
	remove,
	id,
	index,
});

/**	@param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
 *	@param {TodoRender} contentRender
 *	@param {Todo} todo
 *	@returns {[root: HTMLLIElement, binder: ItemBinder]}
 */
function fillItem(cloneBlankItem, contentRender, todo) {
	const root = cloneBlankItem();
	const checkbox = root.querySelector(SELECTOR_CHECKBOX);
	const remove = root.querySelector(SELECTOR_REMOVE);
	if (
		!(
			checkbox instanceof HTMLInputElement &&
			remove instanceof HTMLButtonElement
		)
	)
		throw new Error('Unexpected <li> shape for todo');

	const content = contentRender(todo);

	root.dataset['index'] = String(todo.index);
	checkbox.checked = todo.completed;
	checkbox.id = todo.id;
	remove.before(content);

	const binder = makeItemBinder(root, checkbox, remove, todo.id, todo.index);

	return [root, binder];
}

/**	@param {ItemBinder} itemA
 *	@param {ItemBinder} itemB
 */
const byIndexAsc = ({ index: a }, { index: b }) => a - b;

/**	@typedef {(todo: Todo) => HTMLElement} TodoRender */

/**	@param {FromTodoContent} fromContent
 *	@param {string} contentSelector
 *	@param {HTMLUListElement} list
 *	@returns {ItemCollection}
 */
function fromUL(fromContent, contentSelector, list) {
	const items = list.children;

	/** @type {ItemCollection} */
	const binders = [];
	for (let i = 0; i < items.length; i += 1) {
		const root = items.item(i);
		if (!(root instanceof HTMLLIElement)) continue;

		const content = root.querySelector(contentSelector);
		if (!(content instanceof HTMLElement)) continue;

		const [id] = fromContent(content);
		if (id === undefined) continue;

		const value = root.dataset['index'];
		const index = value ? parseInt(value, 10) : NaN;
		if (Number.isNaN(index)) continue;

		const completed = root.querySelector(SELECTOR_CHECKBOX);
		if (!(completed instanceof HTMLInputElement)) continue;

		const remove = root.querySelector(SELECTOR_REMOVE);
		if (!(remove instanceof HTMLButtonElement)) continue;

		binders.push(makeItemBinder(root, completed, remove, id, index));
	}

	return binders.sort(byIndexAsc);
}

/**	@param {ItemCollection} binders
 *	@param {ItemBinder} newBinder
 *	@returns { HTMLLIElement | undefined }
 */
function spliceItemBinder(binders, newBinder) {
	const last = binders.length - 1;
	// Scan collection in reverse bailing on the
	// first index property smaller than the
	// new index property
	// (item binders are in ascending index property order)
	let i = last;
	for (; i > -1; i -= 1) if (binders[i].index < newBinder.index) break;

	if (i < 0) {
		binders[0] = newBinder;
		return undefined;
	}

	const before = binders[i].root;
	if (i === last) {
		binders.push(newBinder);
		return before;
	}

	binders.splice(i, 0, newBinder);
	return before;
}

/**	@param {ToggleTodo} toggleTodo
 *	@param {RemoveTodo} removeTodo
 *	@param {ItemCollection} binders
 *	@param {EventTarget | undefined | null} target
 *	@returns { boolean } actionRequested
 */
function dispatchIntent(toggleTodo, removeTodo, binders, target) {
	// checkbox clicked →  toggle todo
	// button clicked → remove todo
	/**	@type {[
	 *	predicate: ((binder: ItemBinder) => boolean) | undefined,
	 *		remove: boolean,
	 *		completed: boolean,
	 *	]}
	 */
	const [predicate, remove, completed] =
		target instanceof HTMLInputElement
			? [(binder) => binder.completed === target, false, target.checked]
			: target instanceof HTMLButtonElement
			  ? [(binder) => binder.remove === target, true, false]
			  : [undefined, false, false];

	if (predicate === undefined) return false;

	const binder = binders.find(predicate);
	if (!binder) return false;

	if (remove) removeTodo(binder.id);
	else toggleTodo(binder.id, completed);

	// action requested
	return true;
}

/** @typedef {object} Binder
 *	@property {HTMLUListElement} root
 *	@property {boolean} disabled
 *	@property {ItemCollection} items
 *	@property {(this: Binder, event: Event) => void} handleEvent
 *	@property {(() => void) | undefined} unsubscribeStatus
 *	@property {(() => void) | undefined} unsubscribeTodoEvent
 */

/** @param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
 *	@param {TodoRender} contentRender
 *	@param {HTMLUListElement} list
 *	@param {ItemCollection} binders
 *	@param {Readonly<Todo>} todo
 */
function addItem(cloneBlankItem, contentRender, list, binders, todo) {
	const [item, binder] = fillItem(cloneBlankItem, contentRender, todo);
	const before = spliceItemBinder(binders, binder);
	if (before) {
		before.after(item);
	} else {
		list.prepend(item);
	}
}

/**	@param {ItemCollection} binders
 *	@param {string} id
 */
function removeItem(binders, id) {
	const i = binders.findIndex((binder) => binder.id === id);
	if (i < 0) return;

	const binder = binders[i];
	binders.splice(i, 1);
	binder.root.remove();
}

/**	@param {ItemCollection} binders
 *	@param {string} id
 *	@param {boolean} completed
 */
function toggleItem(binders, id, completed) {
	const binder = binders.find((binder) => binder.id === id);
	if (!binder) return;

	const checkbox = binder.completed;
	if (completed !== checkbox.checked) checkbox.checked = completed;
}

/**	@param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
 *	@param {TodoRender} contentRender
 *	@param {Binder} binder
 *	@returns {(event: TodoEvent) => void}
 */
function makeTodoNotify(cloneBlankItem, contentRender, binder) {
	return function todoNotify(event) {
		switch (event.kind) {
			case 'todo-new':
				return addItem(
					cloneBlankItem,
					contentRender,
					binder.root,
					binder.items,
					event.todo
				);

			case 'todo-remove':
				return removeItem(binder.items, event.id);

			case 'todo-toggle':
				return toggleItem(binder.items, event.id, event.completed);
		}
	};
}

/** @param {Binder} binder
 * @param {AvailableStatus} status
 */
function onAvailable(binder, status) {
	const disabled = status !== availableStatus.READY;
	const value = disabled ? 'true' : 'false';
	binder.disabled = disabled;
	binder.root.classList.toggle(MODIFIER_DISABLED, disabled);
	binder.root.setAttribute('aria-disabled', value);

	for (let i = 0; i < binder.items.length; i += 1) {
		const item = binder.items[i];
		item.completed.disabled = disabled;
		item.remove.setAttribute('aria-disabled', value);
	}
}

/**	@param {{
 *		content: {
 *			render: TodoRender;
 *			from: FromTodoContent;
 *			selector: string;
 *		};
 *		removeTodo: RemoveTodo;
 *		toggleTodo: ToggleTodo;
 * 		subscribeStatus: SubscribeStatus;
 *		subscribeTodoEvent: SubscribeTodoEvent;
 *	}} dependencies
 */
function makeDefinition({
	content,
	removeTodo,
	toggleTodo,
	subscribeStatus,
	subscribeTodoEvent,
}) {
	const cloneBlankItem = makeCloneBlankItem();

	/** @this Binder
	 *	@param {Event} event
	 */
	function handleEvent(event) {
		if (this.disabled) return;

		if (event.type === 'click') {
			// Toggle/Remove Todo
			dispatchIntent(toggleTodo, removeTodo, this.items, event.target);
			return;
		}
	}

	/** @type { Map<Element, Binder> } */
	const instances = new Map();

	/** @type {Spec} */
	const spec = {
		connectedCallback(root) {
			if (!(root instanceof HTMLUListElement))
				throw new Error('Unexpected root element type');

			/** @type {Binder} */
			const binder = {
				root,
				disabled: root.classList.contains(MODIFIER_DISABLED),
				items: fromUL(content.from, content.selector, root),
				handleEvent,
				unsubscribeStatus: undefined,
				unsubscribeTodoEvent: undefined,
			};

			binder.unsubscribeStatus = subscribeStatus((status) =>
				onAvailable(binder, status)
			);
			binder.unsubscribeTodoEvent = subscribeTodoEvent(
				makeTodoNotify(cloneBlankItem, content.render, binder)
			);
			root.addEventListener('click', binder);

			instances.set(root, binder);
		},

		disconnectedCallback(root) {
			const binder = instances.get(root);
			if (!binder) return;

			instances.delete(binder.root);
			binder.root.removeEventListener('click', binder);
			binder.unsubscribeStatus?.();
			binder.unsubscribeTodoEvent?.();
		},
	};

	return {
		selector: SELECTOR_ROOT,
		spec,
	};
}

export { makeDefinition };
