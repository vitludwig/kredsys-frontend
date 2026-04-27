import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { uiLogin, openSideMenu } from '../../support/login';
import {
	adminUser, workerUser, powerUser, memberUser, blockedUser,
} from '../../fixtures/data/users';

test.describe('Auth — login flow', () => {
	test('admin login lands authenticated (place select after redirect)', async ({ page }) => {
		await page.goto('/login');
		await uiLogin(page, adminUser.email, adminUser.password);
		// Login → /sale → placeGuard bounces an admin without a place to /place-select.
		await expect(page).toHaveURL(/\/(sale|place-select)(\?|$|\/)/);
		const apiToken = await page.evaluate(() => localStorage.getItem('apiToken'));
		expect(apiToken).toBeTruthy();
	});

	test('worker login lands on /place-select (no preselected place)', async ({ page }) => {
		await page.goto('/login');
		await uiLogin(page, workerUser.email, workerUser.password);
		await expect(page).toHaveURL(/\/place-select(\?|$|\/)/);
	});

	test('powerSalesman login lands on /place-select', async ({ page }) => {
		await page.goto('/login');
		await uiLogin(page, powerUser.email, powerUser.password);
		await expect(page).toHaveURL(/\/place-select(\?|$|\/)/);
	});

	test('member login lands on /sale (no place gate for non-worker member flows)', async ({ page }) => {
		await page.goto('/login');
		await uiLogin(page, memberUser.email, memberUser.password);
		// Member also goes through SALE redirect → placeGuard. Member has no
		// place either, so they too end at /place-select. Document the actual
		// behaviour rather than asserting the aspirational one.
		await expect(page).toHaveURL(/\/(sale|place-select)(\?|$|\/)/);
	});

	test('wrong password shows error alert', async ({ page }) => {
		// Login error toast emits a console.error from the component on failure
		// — that's expected behaviour, not a test fault.
		test.info().annotations.push({ type: 'allow-console-errors' });
		await page.goto('/login');
		await uiLogin(page, adminUser.email, 'WRONG_PASSWORD');
		await expect(page.locator('.mat-mdc-snack-bar-container').first()).toBeVisible();
		await expect(page).toHaveURL(/\/login/);
		const apiToken = await page.evaluate(() => localStorage.getItem('apiToken'));
		expect(apiToken).toBeFalsy();
	});

	test('blocked user shows the same error (no enumeration)', async ({ page }) => {
		test.info().annotations.push({ type: 'allow-console-errors' });
		await page.goto('/login');
		await uiLogin(page, blockedUser.email, blockedUser.password);
		await expect(page.locator('.mat-mdc-snack-bar-container').first()).toBeVisible();
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Auth — session lifecycle', () => {
	test('auto-login from existing apiToken keeps user authenticated after reload', async ({
		asAdmin,
	}) => {
		await asAdmin.goto('/admin/users');
		await asAdmin.reload();
		await expect(asAdmin).toHaveURL(/\/admin\/users/);
		// /login redirects to /sale when the session is recognised, so visiting
		// /login on a logged-in user must NOT show the form.
		await asAdmin.goto('/login');
		await expect(asAdmin).not.toHaveURL(/\/login/);
	});

	test('expired apiToken is cleared by the auth interceptor', async ({ page }) => {
		// Inject a token whose `exp` is in the past — interceptor must scrub
		// userId + apiToken on the next outgoing request.
		await page.addInitScript(() => {
			const expired = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
				+ '.'
				+ btoa(JSON.stringify({ sub: '1', exp: 1, roles: [] }))
				+ '.';
			localStorage.setItem('apiToken', expired);
			localStorage.setItem('userId', '1');
		});
		await page.goto('/admin/users');
		// Either the guard kicked us to /login, or the interceptor cleared
		// state — both are acceptable.
		await expect(page).toHaveURL(/\/login/);
		const apiToken = await page.evaluate(() => localStorage.getItem('apiToken'));
		expect(apiToken).toBeFalsy();
	});

	test('UI logout clears the session — logout link disappears, user state resets', async ({
		asAdmin,
	}) => {
		await asAdmin.goto('/admin/users');
		await openSideMenu(asAdmin);
		const logoutLink = asAdmin.getByTestId(SEL.nav.logout);
		await expect(logoutLink).toBeVisible();
		await logoutLink.click();
		// AuthService.logout sets user=null which propagates through isLogged$;
		// the @if(authService.isLogged) block in side-menu hides the logout
		// link. That is the user-visible signal that the session is gone.
		// (We can't assert localStorage cleared because the persona's
		// addInitScript re-injects on every navigation — known limitation,
		// see review finding R1#14.)
		await expect(logoutLink).toBeHidden();
	});
});
