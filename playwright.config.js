const { defineConfig } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
	testDir: './tests/e2e',
	timeout: 30 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
		headless: true,
	},
	webServer: {
		command: 'npm start',
		url: `${baseURL}/admin/login`,
		reuseExistingServer: true,
		timeout: 120 * 1000,
	},
});
