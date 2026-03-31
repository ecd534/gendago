const { test, expect } = require('@playwright/test');

const storeSlug = process.env.E2E_STORE_SLUG || 'espacodudaduarte';
const bookingDate = process.env.E2E_BOOKING_DATE || '2026-03-31';

test.describe('Webapp negative scenarios', () => {
	test('blocks booking confirmation when client is not authenticated', async ({ page }) => {
		await page.goto(`/app/${storeSlug}`);
		await page.getByRole('button', { name: 'Agendar' }).first().click();

		await page.getByLabel('Profissional').selectOption({ index: 1 });
		await page.getByLabel('Data').fill(bookingDate);
		await page.getByRole('button', { name: 'Ver horarios' }).click();

		const firstSlot = page.locator('.slot-button').first();
		await expect(firstSlot).toBeVisible();
		await firstSlot.click();
		await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

		await expect(page.getByText('Faca login para confirmar seu agendamento.')).toBeVisible();
	});

	test('shows error for invalid login credentials', async ({ page }) => {
		await page.goto(`/app/${storeSlug}`);
		await page.getByRole('button', { name: 'Fazer Login' }).click();

		await page.getByLabel('Email ou telefone').fill('duda@agendago.com');
		await page.getByLabel('Senha').first().fill('senha-invalida');
		await page.getByRole('button', { name: 'Entrar' }).click();

		await expect(page.getByText('E-mail/telefone ou senha invalidos')).toBeVisible();
	});
});
