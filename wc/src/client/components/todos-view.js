// @ts-check
// file: src/components/todos-view.js

/** @typedef {import('../index').Todo} Todo */
/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').RemoveTodo} RemoveTodo */
/** @typedef {import('../app').ToggleTodo} ToggleTodo */
/** @typedef {import('../app').TodoEvent} TodoEvent */
/** @typedef {import('../app').SubscribeTodoEvent} SubscribeTodoEvent */

const NAME = 'todos-view';
const TEMPLATE_ITEM_ID = 'template-todo-item';
const SELECTOR_TITLE = '.js\\:c-todos-view__title';
const SELECTOR_NEW = '.js\\:c-todos-view__new';
const SELECTOR_LIST = '.js\\:c-todos-view__list';
const SELECTOR_LABEL = 'label';
const SELECTOR_CHECKBOX = 'input[type=checkbox]';
const SELECTOR_REMOVE = 'button';

/** @returns {() => HTMLLIElement} */
function makeCloneBlankItem() {
	const template = document.getElementById(TEMPLATE_ITEM_ID);
	if (!(template instanceof HTMLTemplateElement))
		throw Error(`${TEMPLATE_ITEM_ID} template not found`);

	const root = template.content.firstElementChild;
	if (!(root instanceof HTMLLIElement))
		throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

	return function cloneBlankItem() {
		return /** @type {HTMLLIElement} */ (root.cloneNode(true));
	}
}

/** @typedef {object} ItemBinder
	* @property {HTMLLIElement} root
	* @property {HTMLInputElement} completed
	* @property {HTMLButtonElement} remove
	* @property {string} id
	* @property {number} index
	*/

/** @typedef {ItemBinder[]} ItemCollection */
/* Note keep sorted by ascending index property */

/** @param {ItemBinder['root']} root 
	* @param {ItemBinder['completed']} completed 
	* @param {ItemBinder['remove']} remove 
	* @param {ItemBinder['id']} id 
	* @param {ItemBinder['index']} index 
	*/
const makeItemBinder = (root, completed, remove, id, index) =>
	({ root, completed, remove, id, index });

/** @param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
	* @param {Todo} todo
	* @returns {[root: HTMLLIElement, binder: ItemBinder]}
	*/
function fillItem(cloneBlankItem, todo) {
	const root = cloneBlankItem();
	const label = root.querySelector(SELECTOR_LABEL);
	const checkbox = root.querySelector(SELECTOR_CHECKBOX);
	const remove = root.querySelector(SELECTOR_REMOVE);
	if (!(
		label instanceof HTMLLabelElement && 
		checkbox instanceof HTMLInputElement &&
		remove instanceof HTMLButtonElement 
	))
		throw new Error('Unexpected <li> shape for todo');

	root.dataset['index'] = String(todo.index);
	checkbox.checked = todo.completed;
	label.dataset['id'] = todo.id;
	if (todo.title) label.appendChild(new Text(todo.title));

	const binder = makeItemBinder(root, checkbox, remove, todo.id, todo.index);

	return [root, binder];
}

/**	@param {ItemBinder} itemA
	* @param {ItemBinder} itemB
	*/
const byIndexAsc = ({index: a}, {index: b}) => a - b;

/** @param {HTMLUListElement} list
	* @returns {ItemCollection}
	*/
function fromUL(list) {
	const items = list.children;

	/** @type {ItemCollection} */
	const binders = [];
	for (let i = 0; i < items.length; i += 1) {
		const root = items.item(i);
		if (!(root instanceof HTMLLIElement))
			continue;

		const value = root.dataset['index'];
		const index = value ? parseInt(value, 10) : NaN;
		if (Number.isNaN(index))
			continue;

		const label = root.querySelector(SELECTOR_LABEL);
		if (!(label instanceof HTMLLabelElement))
			continue;

		const id = label.dataset['id'] ?? '';
		if (id.length < 1)
			continue;

		const completed = root.querySelector(SELECTOR_CHECKBOX);
		if (!(completed instanceof HTMLInputElement))
			continue;

		const remove = root.querySelector(SELECTOR_REMOVE);
		if (!(remove instanceof HTMLButtonElement))
			continue;

		binders.push(makeItemBinder(root, completed, remove, id, index));
	}

	return binders.sort(byIndexAsc);
}

/** @param {ItemCollection} binders 
	* @param {ItemBinder} newBinder
	* @returns { HTMLLIElement | undefined }
	*/
function spliceItemBinder(binders, newBinder) {
	const last = binders.length - 1;
	// Scan collection in reverse bailing on the
	// first index property smaller than the
	// new index property 
	// (item binders are in ascending index property order)
	let i = last;
	for(;i > -1; i -= 1)
		if (binders[i].index < newBinder.index) break;

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

/** @param {ToggleTodo} toggleTodo
 	* @param {RemoveTodo} removeTodo
	*	@param {ItemCollection} binders 
	* @param {EventTarget | undefined | null} target
	* @returns { boolean } actionRequested
	*/
function dispatchIntent(toggleTodo, removeTodo, binders, target){
	// checkbox clicked →  toggle todo
	// button clicked → remove todo
	/** @type {[
		*		predicate: ((binder: ItemBinder) => boolean) | undefined,
		*		remove: boolean,
		*		completed: boolean,
		* ]} 
		*/
	const [predicate, remove, completed] = 
		target instanceof HTMLInputElement	?
		[(binder) => binder.completed === target, false, target.checked] :
		target instanceof HTMLButtonElement ? 
		[(binder) => binder.remove === target, true, false] :
		[undefined, false, false];

	if (predicate === undefined)
		return false;

	const binder = binders.find(predicate);
	if(!binder)
		return false;

	if (remove) removeTodo(binder.id);
	else toggleTodo(binder.id, completed);

	// action requested
	return true;
}

/** @typedef {object} Binder
	* @property {HTMLElement} root
	* @property {HTMLInputElement} title
	* @property {HTMLButtonElement} newTitle
	* @property {HTMLUListElement} list
	* @property {ItemCollection} items
	* @property {() => void} unsubscribeTodoEvent
	*/

/** @param {ItemCollection} binders
 * @param {string} id
 */
function removeItem(binders, id) {
	const i = binders.findIndex((binder) => binder.id === id);
	if (i < 0) return;
	
	const binder = binders[i];
	binders.splice(i,1);
	binder.root.remove()
}

/** @param {ItemCollection} binders
 	* @param {string} id
 	* @param {boolean} completed
 	*/
function toggleItem(binders, id, completed) {
	const binder = binders.find((binder) => binder.id === id);
	if (!binder) return;

	const checkbox = binder.completed;
	if (completed !== checkbox.checked) checkbox.checked = completed;
}

/** @param {{
 * 	addTodo: AddTodo;
 * 	removeTodo: RemoveTodo;
 * 	toggleTodo: ToggleTodo;
 * 	subscribeTodoEvent: SubscribeTodoEvent;
 * }} depend
 */
function makeClass({ addTodo, removeTodo, toggleTodo, subscribeTodoEvent }) {
  const cloneBlankItem = makeCloneBlankItem();

	/** @param {HTMLUListElement} list
		* @param {ItemCollection} binders
		* @param {Readonly<Todo>} todo
 		*/
	function addItem(list, binders, todo) {
		const [item, binder] = fillItem(cloneBlankItem, todo);
		const before = spliceItemBinder(binders, binder);
		if (before) {
			before.after(item);
		} else {
			list.prepend(item);
		}
	}

	/** @param {HTMLInputElement} title
 		*/
	async function dispatchAddTodo(title) {
		await addTodo(title.value);
		title.value = '';
	}

	class TodosView extends HTMLElement {
		/** @type {Binder | undefined} */
		binder;

		constructor() {
			super();
		}

		connectedCallback() {
			const title = this.querySelector(SELECTOR_TITLE);
			if (!(title instanceof HTMLInputElement))
				throw new Error('Unable to bind to todo "title" input');

			const newTitle = this.querySelector(SELECTOR_NEW);
			if (!(newTitle instanceof HTMLButtonElement))
				throw new Error('Unable to bind to "new" todo button');

			const list = this.querySelector(SELECTOR_LIST);
			if (!(list instanceof HTMLUListElement))
				throw new Error('Unable to bind to todo list');

			/** @type {Binder} */
			const binder = {
				root: this,
				title,
				newTitle,
				list,
				items: fromUL(list),
				unsubscribeTodoEvent: subscribeTodoEvent((event) => {
					switch (event.kind) {
						case 'todo-new':
							return addItem(binder.list, binder.items, event.todo);

						case 'todo-remove':
							return removeItem(binder.items, event.id);

						case 'todo-toggle':
							return toggleItem(binder.items, event.id, event.completed);
					};
				}),
			};

			binder.newTitle.addEventListener('click', this);
			binder.list.addEventListener('click', this);

			this.binder = binder;
		}

		disconnectedCallback() {
			if (!this.binder) return;

			const binder = this.binder;
			this.binder = undefined;
			binder.list.removeEventListener('click', this);
			binder.newTitle.removeEventListener('click', this);
			binder.unsubscribeTodoEvent();
		}

		/** @param {Event} event */
		handleEvent(event) {
			if (!this.binder) return;

			const { newTitle, title } = this.binder;

			if (event.type === 'click') {
				if (event.target === newTitle) {
					// Add new todo
					event.preventDefault();
					if (title.value.length < 1) return;

					dispatchAddTodo(title);
					return;
				}

				// Toggle/Remove Todo
				dispatchIntent(
					toggleTodo, 
					removeTodo, 
					this.binder.items, 
					event.target
				);
				return;
			}
		}

	}

	return TodosView;
}

export { NAME, makeClass };
