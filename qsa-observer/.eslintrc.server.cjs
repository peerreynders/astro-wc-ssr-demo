module.exports = {
  extends: [
    '.eslintrc.base.cjs',
  ],
	ignorePatterns: [
		'dist',
		'.astro',
		'node-modules',
		'src/client',
		'public/main.js'
	],
	rules: {
		'@typescript-eslint/triple-slash-reference': 'off'	
	},
};
