import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { place1, places } from '../../fixtures/data/places';

test.describe('Admin / places', () => {
	test('list shows seeded places', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/places');
		const rows = asAdmin.locator('[data-testid^="row-place-"]');
		await expect(rows).toHaveCount(places.length);
		await expect(asAdmin.getByTestId(SEL.row.place(place1.id))).toContainText(place1.name);
	});

	test('create with empty name does nothing (form invalid)', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/places/new');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/places\/new/);
	});

	test('create new place persists to list', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/places/new');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Created Place');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/places(\?|$|\/)/);
		await expect(asAdmin.getByText('e2e-Created Place')).toBeVisible();
	});

	test('edit place name persists', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/places/${place1.id}/edit`);
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Renamed Place');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/places(\?|$|\/)/);
		await expect(asAdmin.getByTestId(SEL.row.place(place1.id))).toContainText('e2e-Renamed Place');
	});

	test('place sortiment is shown on edit', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/places/${place1.id}/edit`);
		// "Sortiment" header should be visible
		await expect(asAdmin.getByText('Sortiment')).toBeVisible();
	});

	test('navigation to transactions list works from place detail', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/places/${place1.id}/edit`);
		await asAdmin.getByText('Seznam transakcí').click();
		await expect(asAdmin).toHaveURL(/\/admin\/transactions\/\d+/);
	});
});
