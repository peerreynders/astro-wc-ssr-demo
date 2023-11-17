// @ts-check
// file: src/client/components/todo-new.js

/** @typedef {import('../app').AddTodo} AddTodo */

const NAME = 'todo-new';
const SELECTOR_TITLE = '.js\\:c-todo-new__title';
const SELECTOR_NEW = '.js\\:c-todo-new__submit';

/** @typedef {object} Binder
 *	@property {HTMLFormElement} root
 *	@property {HTMLInputElement} title
 *	@property {HTMLButtonElement} submit
 *	@property {(this: Binder, event: Event) => void} handleEvent
 */

/** @param {{
 * 	addTodo: AddTodo
 * }} dependencies
 */
function makeDefinition({ addTodo }) {
	/**	@param {HTMLInputElement} title
	 */
	async function dispatchAddTodo(title) {
		await addTodo(title.value);
		title.value = '';
	}

	/** @this Binder
	 *	@param {Event} event
	 */
	function handleEvent(event) {
		if (event.type === 'click' && event.target === this.submit) {
			event.preventDefault();
			if (this.title.value.length < 1) return;

			dispatchAddTodo(this.title);
			return;
		}
	}

	class TodoNew extends HTMLFormElement {
		/** @type {Binder | undefined} */
		binder;

		constructor() {
			super();
		}

		connectedCallback() {
			const title = this.querySelector(SELECTOR_TITLE);
			if (!(title instanceof HTMLInputElement))
				throw new Error('Unable to bind to "title" input');

			const submit = this.querySelector(SELECTOR_NEW);
			if (!(submit instanceof HTMLButtonElement))
				throw new Error('Unable to bind to submit button');

			/** @type {Binder} */
			const binder = {
				root: this,
				title,
				submit,
				handleEvent,
			};
			binder.submit.addEventListener('click', binder);
			this.binder = binder;
		}

		disconnectedCallback() {
			if (!this.binder) return;

			const binder = this.binder;
			this.binder = undefined;
			binder.submit.removeEventListener('click', binder);
		}
	}

	return {
		name: NAME,
		constructor: TodoNew,
		options: { extends: 'form' },
	};
}

export { makeDefinition };
