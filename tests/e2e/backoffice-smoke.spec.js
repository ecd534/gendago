const { test, expect } = require('@playwright/test');

test.describe('Backoffice smoke', () => {
	test('loads admin login and submits credentials', async ({ page }) => {
		const email = process.env.E2E_ADMIN_EMAIL || 'duda@agendago.com';
		const password = process.env.E2E_ADMIN_PASSWORD || '123456';

		await page.goto('/admin/login');
		await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

		await page.getByLabel('E-mail').fill(email);
		await page.getByLabel('Senha').fill(password);
		await page.getByRole('button', { name: 'Entrar' }).click();

		await expect(page).toHaveURL(/\/admin\/agendamentos/);
		await expect(page.getByRole('heading', { name: 'Gerenciar Agendamentos' })).toBeVisible();
	});
});
