module.exports = {
	collectCoverage: false,
	collectCoverageFrom: [
		'src/**/*.js',
		'!src/app.js',
		'!src/views/**',
		'!src/route/**',
	],
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/public/',
	],
	setupFiles: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'node',
	testMatch: [
		'**/__tests__/**/*.test.js',
		'**/?(*.)+(spec|test).js',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'/coverage/',
		'/docs/',
		'/_smoke_test.js',
	],
};