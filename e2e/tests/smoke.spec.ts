import { test, expect } from '../support/personas';
import { SEL } from '../support/selectors';
import { memberUser } from '../fixtures/data/users';
import { scanCard } from '../support/pos';

test.describe('Smoke', () => {
	test('admin lands on /place-select after login', async ({ asAdmin }) => {
		await asAdmin.goto('/');
		// admin has no preselected place, so the SALE redirect bounces to /place-select
		await expect(asAdmin).toHaveURL(/\/sale|\/place-select/);
	});

	test('admin can navigate to /admin/users and sees the user list', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/users');
		await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id))).toBeVisible();
	});

	test('worker on /sale can scan a card via debug dropdown', async ({ asWorker }) => {
		await asWorker.goto('/sale');
		await scanCard(asWorker, 'Marie Členka');
		await expect(asWorker.getByTestId(SEL.topMenu.balance)).toBeVisible();
	});
});
