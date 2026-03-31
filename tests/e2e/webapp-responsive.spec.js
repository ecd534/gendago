const { test, expect } = require('@playwright/test');

const storeSlug = process.env.E2E_STORE_SLUG || 'espacodudaduarte';

const viewports = [
	{ name: 'notebook', width: 1440, height: 900 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'smartphone', width: 390, height: 844 },
];

for (const viewport of viewports) {
	test(`webapp vitrine renders on ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.goto(`/app/${storeSlug}`);

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Procedimentos' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Agendar' }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: 'Fazer Login' })).toBeVisible();
	});
}
