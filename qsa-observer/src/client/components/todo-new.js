// @ts-check
// file: src/client/components/todo-new.js
import { availableStatus } from '../app/available-status';

/** @typedef { import('../types').QsaoSpec } Spec */

/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').AvailableStatus} AvailableStatus */
/** @typedef {import('../app').SubscribeStatus} SubscribeStatus */

const SELECTOR_ROOT = '.js\\:c-todo-new';
const SELECTOR_TITLE = '.js\\:c-todo-new__title';
const SELECTOR_NEW = '.js\\:c-todo-new__submit';
const MODIFIER_DISABLED = 'js:c-todo-new--disabled';
const MODIFIER_WAIT = 'js:c-todo-new--wait';

/** @typedef {object} Binder
 *  @property {HTMLFormElement} root
 *  @property {HTMLInputElement} title
 *  @property {HTMLButtonElement} submit
 *  @property {boolean} disabled
 *  @property {(this: Binder, event: Event) => void} handleEvent
 *	@property {(() => void) | undefined} unsubscribeStatus
 */

/** @param {Binder} binder
 * @param {AvailableStatus} status
 */
function onAvailable(binder, status) {
	const [disabled, wait] =
		status === availableStatus.READY
			? [false, false]
			: status === availableStatus.WAIT
			? [true, true]
			: [true, false];

	binder.submit.classList.toggle(MODIFIER_WAIT, wait);

	binder.disabled = disabled;
	binder.submit.classList.toggle(MODIFIER_DISABLED, disabled);
	binder.submit.setAttribute('aria-disabled', String(disabled));
	binder.title.classList.toggle(MODIFIER_DISABLED, disabled);
}

/** @param {{
 * 	addTodo: AddTodo;
 * 	subscribeStatus: SubscribeStatus;
 * }} dependencies
 */
function makeDefinition({ addTodo, subscribeStatus }) {
	/**	@param {HTMLInputElement} title
	 */
	async function dispatchAddTodo(title) {
		const name = title.value;
		title.value = '';
		await addTodo(name);
	}

	/** @this Binder
	 *	@param {Event} event
	 */
	function handleEvent(event) {
		if (this.disabled) return;

		if (event.type === 'click' && event.target === this.submit) {
			event.preventDefault();
			if (this.title.value.length < 1) return;

			dispatchAddTodo(this.title);
			return;
		}
	}

	/** @type { Map<Element, Binder> } */
	const instances = new Map();

	/** @type {Spec} */
	const spec = {	
		connectedCallback(root) {
			if (!(root instanceof HTMLFormElement))
				throw new Error('Unexpected root element type');

			const title = root.querySelector(SELECTOR_TITLE);
			if (!(title instanceof HTMLInputElement))
				throw new Error('Unable to bind to "title" input');

			const submit = root.querySelector(SELECTOR_NEW);
			if (!(submit instanceof HTMLButtonElement))
				throw new Error('Unable to bind to submit button');

			/** @type {Binder} */
			const binder = {
				root,
				title,
				submit,
				disabled: submit.classList.contains(MODIFIER_DISABLED),
				handleEvent,
				unsubscribeStatus: undefined,
			};
			binder.submit.addEventListener('click', binder);
			binder.unsubscribeStatus = subscribeStatus((status) =>
				onAvailable(binder, status)
			);

			instances.set(root, binder);
		},

		disconnectedCallback(root) {
			const binder = instances.get(root);
			if (!binder) return;

			instances.delete(binder.root);
			binder.submit.removeEventListener('click', binder);
			binder.unsubscribeStatus?.();
		}
	}

	return {
		selector: SELECTOR_ROOT,
		spec,
	};
}

export { makeDefinition };
