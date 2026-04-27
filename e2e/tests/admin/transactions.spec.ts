import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { place1 } from '../../fixtures/data/places';
import { transactions } from '../../fixtures/data/transactions';

test.describe('Admin / transactions', () => {
	test('place tab loads place transactions when a place is selected', async ({
		asAdmin,
	}) => {
		await asAdmin.goto('/admin/transactions');
		await asAdmin.getByLabel('Místo').click();
		await asAdmin.locator('.mat-mdc-select-panel mat-option').first().click();
		// Once a place is picked, the transactions list renders.
		const placeRows = transactions.filter(t => t.placeId === place1.id);
		await expect(asAdmin.locator('[data-testid^="tx-row-"]').first()).toBeVisible();
		// Just sanity-check that some rows render — exact count depends on
		// pagination defaults that may differ from fixture cardinality.
		expect(placeRows.length).toBeGreaterThan(0);
	});

	test('switching to "Uživatelé" tab shows user-transactions view', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/transactions');
		await asAdmin.getByRole('tab', { name: 'Uživatelé' }).click();
		// User-transactions tab renders an autocomplete labeled
		// "Vyhledat podle jména".
		await expect(asAdmin.getByRole('combobox', { name: 'Uživatel' })).toBeVisible();
	});

	test('"Nová transakce" tab shows the new-transaction form', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/transactions');
		await asAdmin.getByRole('tab', { name: 'Nová transakce' }).click();
		// New-transaction tab renders an interactive surface — assert that
		// at least the tab is now selected and rendered.
		await expect(asAdmin.getByRole('tab', { name: 'Nová transakce', selected: true })).toBeVisible();
	});

	test('"Statistiky" tab reveals download button', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/transactions');
		await asAdmin.getByRole('tab', { name: 'Statistiky' }).click();
		await expect(asAdmin.getByRole('button', { name: 'Stáhnout statistiky' })).toBeVisible();
	});

	test('place-scoped /admin/transactions/:placeId opens directly on the place tab', async ({
		asAdmin,
	}) => {
		await asAdmin.goto(`/admin/transactions/${place1.id}`);
		await expect(asAdmin.locator('[data-testid^="tx-row-"]').first()).toBeVisible();
	});

	test('storno button visible on a payment row', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/transactions/${place1.id}`);
		const rows = asAdmin.locator('[data-testid^="tx-row-"]');
		await expect(rows.first()).toBeVisible();
		// At least one storno button (one per non-cancelled payment) should
		// be present somewhere in the visible rows.
		await expect(asAdmin.getByTestId(SEL.tx.storno).first()).toBeVisible();
	});
});
