module.exports = {
  extends: [
    '.eslintrc.base.cjs',
  ],
	globals: {
		'console': 'readonly',
		'customElements': 'readonly',
		'document': 'readonly',
		'fetch': 'readonly',
		'FormData': 'readonly',
		'HTMLButtonElement': 'readonly',
		'HTMLDivElement': 'readonly',
		'HTMLElement': 'readonly',
		'HTMLInputElement': 'readonly',
		'HTMLLabelElement': 'readonly',
		'HTMLLIElement': 'readonly',
		'HTMLTemplateElement': 'readonly',
		'HTMLUListElement': 'readonly',
		'self': 'readonly',
		'Text': 'readonly',
	}
};
