import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { defaultCurrency, blockedCurrency, currencies } from '../../fixtures/data/currencies';

test.describe('Admin / currencies', () => {
	test('list shows seeded currencies', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/currencies');
		const rows = asAdmin.locator('[data-testid^="row-currency-"]');
		await expect(rows).toHaveCount(currencies.length);
		await expect(asAdmin.getByTestId(SEL.row.currency(defaultCurrency.id))).toContainText(defaultCurrency.name);
	});

	test('create new currency persists to the list', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/currencies/new');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-NewCoin');
		await asAdmin.getByTestId(SEL.form.code).fill('NEW');
		await asAdmin.getByTestId(SEL.form.symbol).fill('★');
		await asAdmin.getByLabel('Minimální částka (varování)').fill('100');
		await asAdmin.getByLabel('Maximální částka (varování)').fill('1000');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/currencies(\?|$|\/)/);
		await expect(asAdmin.getByText('e2e-NewCoin')).toBeVisible();
	});

	test('submit disabled with empty required fields', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/currencies/new');
		// Empty required fields keep submit ineffective. Filling all fields
		// then clearing one re-disables form validity. Using the form-level
		// "form is invalid" outcome — submit click does nothing.
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/currencies\/new/);
	});

	test('edit currency name persists', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/currencies/${defaultCurrency.id}/edit`);
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Renamed');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/currencies(\?|$|\/)/);
		await expect(asAdmin.getByTestId(SEL.row.currency(defaultCurrency.id))).toContainText('e2e-Renamed');
	});
});

test.describe('Admin / currencies — blocked currency seed', () => {
	test('blocked currency appears in list (no toggle UI; assert seed shape)', async ({
		asAdmin,
	}) => {
		await asAdmin.goto('/admin/currencies');
		await expect(asAdmin.getByTestId(SEL.row.currency(blockedCurrency.id))).toContainText(
			blockedCurrency.name,
		);
	});
});
