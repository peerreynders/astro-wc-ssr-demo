// @ts-check
// file: src/client/components/todo-content.js

/** @typedef {import('../index').Todo} Todo */

// const NAME = 'todo-content';
const TEMPLATE_CONTENT_ID = 'template-todo-content';
const SELECTOR_ROOT = '.js\\:c-todo-content';

/** @returns {() => HTMLLabelElement} */
function makeCloneContent() {
	const template = document.getElementById(TEMPLATE_CONTENT_ID);
	if (!(template instanceof HTMLTemplateElement))
		throw Error(`${TEMPLATE_CONTENT_ID} template not found`);

	const root = template.content.firstElementChild;
	if (!(root instanceof HTMLLabelElement))
		throw new Error(`Unexpected ${TEMPLATE_CONTENT_ID} template root`);

	return function cloneContent() {
		return /** @type {HTMLLabelElement} */ (root.cloneNode(true));
	};
}

/**	@param {ReturnType<typeof makeCloneContent>} cloneContent
 *	@param {Todo} todo
 *	@returns {HTMLLabelElement}
 */
function fillContent(cloneContent, todo) {
	const root = cloneContent();

	root.htmlFor = todo.id;
	if (todo.title) root.appendChild(new Text(todo.title));

	return root;
}

/** @type {import('../types').FromTodoContent} */
function fromContent(root) {
	if (!(root instanceof HTMLLabelElement)) return [];

	const id = root.htmlFor ?? '';
	if (id.length < 1) return [];

	const text = root.lastChild;
	const title = text && text instanceof Text ? text.nodeValue ?? '' : '';

	return [id, title];
}

// There is no behavior associated with this content
// so a Web Component isn't necessary
//

function makeSupport() {
	const cloneContent = makeCloneContent();
	/** @type {(todo: Todo) => HTMLElement} */
	const render = (todo) => fillContent(cloneContent, todo);

	return {
		fromContent,
		render,
		selectorRoot: SELECTOR_ROOT,
	};
}

export { makeSupport };
