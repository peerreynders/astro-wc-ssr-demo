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
		'HTMLElement': 'readonly',
		'HTMLFormElement': 'readonly',
		'HTMLInputElement': 'readonly',
		'HTMLLabelElement': 'readonly',
		'HTMLLIElement': 'readonly',
		'HTMLTemplateElement': 'readonly',
		'HTMLUListElement': 'readonly',
		'self': 'readonly',
		'Text': 'readonly',
	}
};
