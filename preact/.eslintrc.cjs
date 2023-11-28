module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	ignorePatterns: [
		'dist',
		'.astro',
		'node-modules',
		'src/client',
		'public/main.js',
	],
	rules: {
		quotes: ['error', 'single', { avoidEscape: true }],
		'@typescript-eslint/no-unused-vars': [
			2,
			{ args: 'all', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'@typescript-eslint/triple-slash-reference': 'off',
	},
};
