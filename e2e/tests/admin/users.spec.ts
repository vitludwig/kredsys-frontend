import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { memberUser, blockedUser, users } from '../../fixtures/data/users';

test.describe('Admin / users — list', () => {
	test('shows non-blocked users by default; blocked toggle reveals blocked', async ({
		asAdmin,
	}) => {
		await asAdmin.goto('/admin/users');
		const rows = asAdmin.locator('[data-testid^="row-user-"]');
		const visible = users.filter(u => !u.blocked).length;
		await expect(rows).toHaveCount(visible);
		// Blocked user is excluded by default
		await expect(asAdmin.getByTestId(SEL.row.user(blockedUser.id))).toHaveCount(0);

		// Flip the "Blokovaní uživatelé" toggle.
		await asAdmin.getByText('Blokovaní uživatelé').click();
		// Now the list reflects the blocked-only / blocked-included query.
		// The mock returns blocked=true rows when includeBlocked=true (or
		// when filter doesn't restrict). Either way, Karel should appear.
		await expect(asAdmin.getByTestId(SEL.row.user(blockedUser.id))).toBeVisible();
	});

	test('search input filters the list (mock honours name#=*x/i)', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/users');
		// onSearch is bound to (keyup) and debounced — pressSequentially fires
		// real keyup events; the debounce timer (default 500ms) then settles.
		await asAdmin.getByLabel('Vyhledávání').pressSequentially('Marie', { delay: 50 });
		await asAdmin.waitForResponse(r => r.url().includes('/users') && r.url().includes('Marie'));
		await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id))).toBeVisible();
		const rows = asAdmin.locator('[data-testid^="row-user-"]');
		await expect(rows).toHaveCount(1);
	});
});

test.describe('Admin / users — create', () => {
	test('valid submission creates a new user and returns to the list', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/users/new');
		await asAdmin.getByTestId(SEL.form.memberId).fill('99999');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Created User');
		await asAdmin.getByTestId(SEL.form.email).fill('e2e-created@test.cz');
		await asAdmin.getByLabel('Heslo', { exact: true }).fill('pwd12345');
		await asAdmin.getByLabel('Heslo znovu').fill('pwd12345');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/users(\?|$|\/)/);
		await expect(asAdmin.getByText('e2e-Created User')).toBeVisible();
	});

	test('submit is disabled when required fields are empty', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/users/new');
		// memberId, name, email are required. With empty form:
		await expect(asAdmin.getByTestId(SEL.form.submit)).toBeDisabled();
		// Filling only some required fields → still disabled.
		await asAdmin.getByTestId(SEL.form.name).fill('Foo');
		await expect(asAdmin.getByTestId(SEL.form.submit)).toBeDisabled();
	});
});

test.describe('Admin / users — edit', () => {
	test('edit user name and persist to list', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/users/${memberUser.id}/edit`);
		const name = asAdmin.getByTestId(SEL.form.name);
		await expect(name).toHaveValue(memberUser.name);
		await name.fill('e2e-Renamed');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/users(\?|$|\/)/);
		await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id))).toContainText('e2e-Renamed');
	});

	test('change-password form submits successfully', async ({ asAdmin }) => {
		// The change-password page renders an embedded sandboxed iframe that
		// pageerrors on localStorage access — pre-existing app issue, not
		// something this test should fail on.
		test.info().annotations.push({ type: 'allow-console-errors' });
		await asAdmin.goto(`/admin/users/${memberUser.id}/change-password`);
		await asAdmin.getByTestId('form-oldPassword').fill('oldpwd1234');
		await asAdmin.getByTestId('form-newPassword').fill('newpwd1234');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).not.toHaveURL(/\/change-password/);
	});
});
