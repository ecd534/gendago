module.exports = {
	env: {
		node: true,
		es2021: true,
		jest: true,
	},
	extends: ['eslint:recommended'],
	ignorePatterns: [
		'coverage/',
		'docs/',
		'node_modules/',
		'public/',
		'src/views/',
	],
	rules: {
		'no-console': 'off',
		'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
	},
};