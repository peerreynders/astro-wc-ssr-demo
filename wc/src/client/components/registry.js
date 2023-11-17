// @ts-check
/**	@param {{
 * 	name: string;
 * 	constructor:CustomElementConstructor;
 *		options?: ElementDefinitionOptions;
 * }} component
 */
const define = ({ name, constructor, options }) =>
	customElements.define(name, constructor, options);

export { define };
