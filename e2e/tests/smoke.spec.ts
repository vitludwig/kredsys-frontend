import { test, expect } from '../support/personas';
import { SEL } from '../support/selectors';
import { memberUser, users } from '../fixtures/data/users';
import { scanCard } from '../support/pos';

test.describe('Smoke', () => {
	test('admin lands on /place-select after login', async ({ asAdmin }) => {
		await asAdmin.goto('/');
		// Admin has no preselected place, so the SALE redirect bounces to
		// /place-select via placeGuard. Anchored regex — the previous form
		// `/\/sale|\/place-select/` matched anything containing the substring
		// "sale" (e.g. /wholesale, /sales-report) and passed regardless of
		// the actual redirect outcome.
		await expect(asAdmin).toHaveURL(/\/place-select(\?|$|\/)/);
	});

	test('admin can navigate to /admin/users and sees the user list', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/users');
		const rows = asAdmin.locator('[data-testid^="row-user-"]');
		// User list defaults to filter=blocked=false, so blocked fixtures are
		// excluded. Whatever the count is, it must be >0 and the member row
		// must contain the expected name (catches binding regressions where
		// rows render but columns are blank).
		const expectedVisible = users.filter(u => !u.blocked).length;
		await expect(rows).toHaveCount(expectedVisible);
		await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id))).toContainText(memberUser.name);
	});

	test('worker on /sale can scan a card via debug dropdown', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		// Wait for the customer + accounts requests to fully resolve before
		// asserting, so we don't race the synchronous customer$ pipe ahead of
		// the async GET /users/:id/accounts response (caught a flake here).
		const accountsResponse = asWorker.waitForResponse(
			r => /\/users\/\d+\/accounts/.test(r.url()) && r.ok(),
		);
		await scanCard(asWorker, 'Marie Členka');
		await accountsResponse;
		await expect(asWorker.getByTestId(SEL.topMenu.balance)).toBeVisible();
	});
});
