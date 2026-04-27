import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { openSideMenu, openAdminMenu } from '../../support/login';

test.describe('Guards — authGuard', () => {
	test('unauthenticated request to /admin/users redirects to /login', async ({ page }) => {
		await page.goto('/admin/users');
		await expect(page).toHaveURL(/\/login/);
	});

	test('unauthenticated request to /sale redirects to /login', async ({ page }) => {
		await page.goto('/sale');
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Guards — placeGuard', () => {
	test('worker without selected place is redirected to /place-select on /sale', async ({
		page,
	}) => {
		// Authenticate as worker but DO NOT call selectPlace — placeGuard
		// should bounce them off /sale.
		const { authAdapter } = await import('../../fixtures/auth-adapter');
		const { workerUser } = await import('../../fixtures/data/users');
		await authAdapter.loginAs(page, workerUser);
		await page.goto('/sale');
		await expect(page).toHaveURL(/\/place-select(\?|$|\/)/);
	});

	test('worker WITH selectedPlaceId in localStorage can access /sale', async ({
		asWorker,
	}) => {
		// asWorker persona pre-selects place1.
		await asWorker.goto('/sale');
		await expect(asWorker).toHaveURL(/\/sale(\?|$|\/)/);
		await expect(asWorker.getByTestId(SEL.topMenu.place)).toBeVisible();
	});
});

test.describe('Guards — role-based menu visibility', () => {
	test('admin sees the full admin section in the side menu', async ({ asAdmin }) => {
		await asAdmin.goto('/');
		await openAdminMenu(asAdmin);
		await expect(asAdmin.getByTestId(SEL.nav.adminUsers)).toBeVisible();
		await expect(asAdmin.getByTestId(SEL.nav.adminPlaces)).toBeVisible();
		await expect(asAdmin.getByTestId(SEL.nav.adminCurrencies)).toBeVisible();
		await expect(asAdmin.getByTestId(SEL.nav.adminGoods)).toBeVisible();
	});

	test('worker does NOT have admin sub-items in the side menu', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		// Wait for the place role fetch to settle — canAccessRoute consults
		// it and the menu re-renders only after placeRole$ has emitted.
		await asWorker.waitForResponse(r => /\/places\/\d+\/roles/.test(r.url()) && r.ok());
		await openSideMenu(asWorker);
		// Even if the "Admin" expandable header is briefly visible while
		// placeRole is null, every admin sub-item has its own canAccessRoute
		// gate that correctly evaluates to false for workers.
		await expect(asWorker.getByTestId(SEL.nav.adminUsers)).toBeHidden();
		await expect(asWorker.getByTestId(SEL.nav.adminCurrencies)).toBeHidden();
		await expect(asWorker.getByTestId(SEL.nav.adminGoods)).toBeHidden();
	});

	test('member does NOT have admin sub-items in the side menu', async ({ asMember }) => {
		await asMember.goto('/');
		await openSideMenu(asMember);
		await expect(asMember.getByTestId(SEL.nav.adminUsers)).toBeHidden();
		await expect(asMember.getByTestId(SEL.nav.adminPlaces)).toBeHidden();
		await expect(asMember.getByTestId(SEL.nav.adminCharge)).toBeHidden();
	});
});
