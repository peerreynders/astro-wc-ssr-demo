// @ts-check
// file: src/components/todos-view.js
/** @typedef { import('../types').QsaoSpec } Spec */

/** @typedef {import('../index').Todo} Todo */
/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').RemoveTodo} RemoveTodo */
/** @typedef {import('../app').ToggleTodo} ToggleTodo */
/** @typedef {import('../app').TodoEvent} TodoEvent */
/** @typedef {import('../app').SubscribeTodoEvent} SubscribeTodoEvent */

const NAME = 'js\\:c-todos-view';
const TEMPLATE_ITEM_ID = 'template-todo-item';
const SELECTOR_TITLE = '.js\\:c-todos-view__title';
const SELECTOR_NEW = '.js\\:c-todos-view__new';
const SELECTOR_LIST = '.js\\:c-todos-view__list';
const SELECTOR_LABEL = 'label';
const SELECTOR_CHECKBOX = 'input[type=checkbox]';
const SELECTOR_ITEM = 'li[data-index]';

/** @param{ string } id */
const makeLabelIdSelector = (id) => `label[data-id="${id}"]`;

function getItemBlank() {
	const template = document.getElementById(TEMPLATE_ITEM_ID);
	if (!(template instanceof HTMLTemplateElement))
		throw Error(`${TEMPLATE_ITEM_ID} template not found`);

	const root = template.content.firstElementChild;
	if (!(root instanceof HTMLLIElement))
		throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

	return root;
}

/** @param {HTMLLIElement} original
 * @param {Todo} todo
 */
function fillTodoItem(original, todo) {
	const root = /** @type{HTMLLIElement} */ (original.cloneNode(true));
	const label = root.querySelector(SELECTOR_LABEL);
	const checkbox = root.querySelector(SELECTOR_CHECKBOX);
	if (
		!(label instanceof HTMLLabelElement && checkbox instanceof HTMLInputElement)
	)
		throw new Error('Unexpected <li> shape for todo');

	root.dataset['index'] = String(todo.index);
	checkbox.checked = todo.completed;
	label.dataset['id'] = todo.id;
	if (todo.title) label.appendChild(new Text(todo.title));

	return root;
}

/** @param {EventTarget | undefined | null} target
 * @param {ToggleTodo} toggleTodo
 * @param {RemoveTodo} removeTodo
 */
function dispatchIntent(target, toggleTodo, removeTodo) {
	let remove = true;
	let completed = false;
	if (target instanceof HTMLInputElement) {
		remove = false;
		completed = target.checked;
	} else if (!(target instanceof HTMLButtonElement)) {
		return false;
	}

	const item = target.closest(SELECTOR_ITEM);
	if (!(item instanceof HTMLLIElement)) return false;

	const label = item.querySelector(SELECTOR_LABEL);
	if (!(label instanceof HTMLLabelElement)) return false;

	const id = label.dataset['id'];
	if (typeof id !== 'string' || id.length < 1) return false;

	if (remove) removeTodo(id);
	else toggleTodo(id, completed);

	return true;
}

/** @typedef {Object} Binder
 * @property {HTMLDivElement} root
 * @property {HTMLInputElement} title
 * @property {HTMLButtonElement} newTitle
 * @property {HTMLUListElement} list
 * @property {HTMLLIElement} itemBlank
 * @property {AddTodo} addTodo
 * @property {RemoveTodo} removeTodo
 * @property {ToggleTodo} toggleTodo
 * @property {(this: Binder, event: Event) => void} handleEvent
 * @property {() => void} unsubscribeTodoEvent
 */

/** @param {Binder} binder
 * @param {Readonly<Todo>} todo
 */
function addItem(binder, todo) {
	/** @type{HTMLElement | undefined} */
	let previous;
	const children = binder.list.children;
	if (children) {
		for (let i = children.length - 1; i > -1; i -= 1) {
			const item = /** @type{HTMLElement} */ (children[i]);
			const value = item.dataset['index'];
			if (!value) continue;
			const index = parseInt(value, 10);
			if (Number.isNaN(index)) continue;

			if (index > todo.index) continue;
			previous = item;
			break;
		}
	}

	const item = fillTodoItem(binder.itemBlank, todo);
	if (previous) {
		previous.after(item);
	} else {
		binder.list.prepend(item);
	}
}

/** @param {Binder} binder
 * @param {string} id
 */
function removeItem(binder, id) {
	const label = binder.list.querySelector(makeLabelIdSelector(id));
	if (!(label instanceof HTMLLabelElement)) return;

	const item = label.closest(SELECTOR_ITEM);
	if (!(item instanceof HTMLLIElement)) return;

	item.remove();
}

/** @param {Binder} binder
 * @param {string} id
 * @param {boolean} completed
 */
function toggleItem(binder, id, completed) {
	const label = binder.list.querySelector(makeLabelIdSelector(id));
	if (!(label instanceof HTMLLabelElement)) return;

	const checkbox = label.querySelector(SELECTOR_CHECKBOX);
	if (!(checkbox instanceof HTMLInputElement)) return;

	if (completed !== checkbox.checked) checkbox.checked = completed;
}

/** @param {Binder} binder
 * @param {string} title
 */
async function dispatchAddTodo(binder, title) {
	await binder.addTodo(title);
	binder.title.value = '';
}

/** @type {Binder['handleEvent']} */
function handleEvent(event) {
	if (event.type === 'click') {
		if (event.target === this.newTitle) {
			// Add new todo
			event.preventDefault();
			if (this.title.value.length < 1) return;

			dispatchAddTodo(this, this.title.value);
			return;
		}

		// Toggle/Delete Todo
		dispatchIntent(
			event.target,
			this.toggleTodo,
			this.removeTodo
		);
		return;
	}
}

/** @param {{
 * 	addTodo: AddTodo;
 * 	removeTodo: RemoveTodo;
 * 	toggleTodo: ToggleTodo;
 * 	subscribeTodoEvent: SubscribeTodoEvent;
 * }} depend
 */
function makeSpec({ addTodo, removeTodo, toggleTodo, subscribeTodoEvent }) {
 	/** @type { Map<Element, Binder> } */
	const	instances = new Map();
	const itemBlank = getItemBlank();

	/** @type {Spec} */
	const spec = {
		connectedCallback(element) {
			if (!(element instanceof HTMLDivElement))
				throw new Error('Unexpected root element type');
			const root = element;

			const title = root.querySelector(SELECTOR_TITLE);
			if (!(title instanceof HTMLInputElement))
				throw new Error('Unable to bind to todo "title" input');

			const newTitle = root.querySelector(SELECTOR_NEW);
			if (!(newTitle instanceof HTMLButtonElement))
				throw new Error('Unable to bind to "new" todo button');

			const list = root.querySelector(SELECTOR_LIST);
			if (!(list instanceof HTMLUListElement))
				throw new Error('Unable to bind to todo list');

			/** @type {Binder} */
			const binder = {
				root,
				title,
				newTitle,
				list,
				itemBlank,
				addTodo,
				removeTodo,
				toggleTodo,
				handleEvent,
				unsubscribeTodoEvent: subscribeTodoEvent((event) => {
					switch (event.kind) {
						case 'todo-new':
							return addItem(binder, event.todo);

						case 'todo-remove':
							return removeItem(binder, event.id);

						case 'todo-toggle':
							return toggleItem(binder, event.id, event.completed);
					}
				}),
			};
			binder.newTitle.addEventListener('click', binder);
			binder.list.addEventListener('click', binder);

			instances.set(root, binder);
		},
		disconnectedCallback(element){
			const binder = instances.get(element);
			if (!binder) return;

			binder.list.removeEventListener('click', binder);
			binder.newTitle.removeEventListener('click', binder);
			binder.unsubscribeTodoEvent();
			instances.delete(element);
		}
	};
	return spec;
}

export { NAME, makeSpec };
