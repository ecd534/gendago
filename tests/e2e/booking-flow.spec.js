const { test, expect } = require('@playwright/test');

const storeSlug = process.env.E2E_STORE_SLUG || 'espacodudaduarte';
const bookingDate = process.env.E2E_BOOKING_DATE || '2026-03-31';
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'duda@agendago.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || '123456';

function uniqueClient() {
	const token = `${Date.now()}`.slice(-6);
	return {
		name: `Julia Marques ${token}`,
		email: `julia.marques.${token}@gendago.com`,
		phone: `119${`${Date.now()}`.slice(-8)}`,
		password: `Julia${token}`,
	};
}

test.describe('Booking flow end-to-end', () => {
	test('creates booking in webapp and confirms status in backoffice', async ({ page }) => {
		test.setTimeout(120000);
		const client = uniqueClient();

		await page.goto(`/app/${storeSlug}`);
		await page.getByRole('button', { name: 'Fazer Login' }).click();
		await page.getByRole('button', { name: 'Nao tenho cadastro' }).click();

		await page.locator('#register-name').fill(client.name);
		await page.locator('#register-email').fill(client.email);
		await page.locator('#register-phone').fill(client.phone);
		await page.locator('#register-password').fill(client.password);
		await page.getByRole('button', { name: 'Criar conta' }).click();

		await expect(page.getByText(`Olá, ${client.name}`)).toBeVisible();

		await page.getByRole('button', { name: 'Agendar' }).first().click();
		const professionalSelect = page.getByLabel('Profissional');
		await professionalSelect.selectOption({ index: 1 });
		await page.getByLabel('Data').fill(bookingDate);
		await page.getByRole('button', { name: 'Ver horarios' }).click();

		const firstSlot = page.locator('.slot-button').first();
		await expect(firstSlot).toBeVisible();
		await firstSlot.click();
		await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
		await expect(page.getByText('Agendamento confirmado com sucesso.')).toBeVisible();

		await page.goto('/admin/login');
		await page.getByLabel('E-mail').fill(adminEmail);
		await page.getByLabel('Senha').fill(adminPassword);
		await page.getByRole('button', { name: 'Entrar' }).click();

		await expect(page).toHaveURL(/\/admin\/agendamentos/);
		await page.locator('input[name="data"]').fill(bookingDate);
		await page.getByRole('button', { name: 'Filtrar' }).click();

		const card = page.locator('.appointment-card-wrap').filter({ hasText: client.name }).first();
		await expect(card).toBeVisible();
		await card.locator('select.status-select').selectOption('confirmado');
		await card.getByRole('button', { name: 'Atualizar' }).click();
		await expect(card.locator('.status-badge')).toHaveText(/confirmado/i);
	});
});
