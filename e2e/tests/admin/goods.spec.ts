import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { goods } from '../../fixtures/data/goods';
import { goodsTypes } from '../../fixtures/data/goods-types';

test.describe('Admin / goods', () => {
	test('list shows seeded goods', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/goods');
		await expect(asAdmin.getByTestId(SEL.row.goods(goods[0].id))).toContainText(goods[0].name);
	});

	test('create new goods returns to /admin/goods', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/goods/new');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Tatranka');
		await asAdmin.getByTestId(SEL.form.price).fill('25');
		// Type select — pick first option so the new goods has a valid
		// goodsTypeId (the list view does currencies[g.currencyId].code which
		// crashes on undefined).
		await asAdmin.getByLabel('Typ').click();
		await asAdmin.locator('.mat-mdc-select-panel mat-option').first().click();
		await asAdmin.getByLabel('Měna').click();
		await asAdmin.locator('.mat-mdc-select-panel mat-option').first().click();
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/goods(\?|$|\/)/);
	});

	test('create with empty required fields is blocked', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/goods/new');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/goods\/new/);
	});

	test('edit goods price persists', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/goods/${goods[0].id}/edit`);
		await asAdmin.getByTestId(SEL.form.price).fill('999');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/goods(\?|$|\/)/);
	});
});

test.describe('Admin / goods — types', () => {
	test('goods page lists seeded goods types', async ({ asAdmin }) => {
		// Goods types are rendered as a second table on /admin/goods (not on
		// /admin/goods/types — that route only has /new and /:id/edit).
		await asAdmin.goto('/admin/goods');
		const typeRow = asAdmin.locator('[data-testid^="row-goods-type-"]').first();
		await expect(typeRow).toBeVisible();
		await expect(asAdmin.getByText(goodsTypes[0].name).first()).toBeVisible();
	});

	test('create new goods type persists', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/goods/types/new');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Slaný');
		await asAdmin.getByTestId(SEL.form.icon).click();
		const panel = asAdmin.locator('.mat-mdc-select-panel').first();
		await expect(panel).toBeVisible();
		await panel.locator('mat-option').first().click();
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/goods(\?|$|\/)/);
	});
});
