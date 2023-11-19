// @ts-check
// file: src/client/components/registry.js
import Qsao from 'qsa-observer';

/** @typedef { import('../types').QsaoSpec } Spec */

// set up component registry
/**  @type { Map<string, Spec> } */
const registry = new Map();
/** @type { string[] } */
const query = [];
const root = self.document;
const qsao = Qsao({
	query,
	root,
	handle(element, mounted, selector) {
		const spec = registry.get(selector);
		if (!spec) return;

		(mounted ? spec.connectedCallback : spec.disconnectedCallback)?.(element);
	},
});

/**	@param {{
 * 	  selector: string;
 *    spec: Spec;
 * }} component
 */
const define = ({selector, spec}) => {
	if (query.includes(selector)) return;

	query.push(selector);
	registry.set(selector, spec);
	qsao.parse(root.querySelectorAll(selector));
};

export { define };
