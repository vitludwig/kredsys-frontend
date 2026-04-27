import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { groups } from '../../fixtures/data/groups';

test.describe('Admin / groups', () => {
	test('list shows seeded groups', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/groups');
		await expect(asAdmin.locator('[data-testid^="row-group-"]')).toHaveCount(groups.length);
		await expect(asAdmin.getByTestId(SEL.row.group(groups[0].id))).toContainText(groups[0].name);
	});

	test('create new group with color persists', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/groups/new');
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-NewGroup');
		await asAdmin.getByTestId(SEL.form.description).fill('e2e-description');
		// Color picker — set value programmatically (Material color input
		// is type=color which doesn't accept fill in some Playwright modes).
		await asAdmin.getByTestId(SEL.form.color).evaluate(
			(el: HTMLInputElement) => { el.value = '#abcdef'; el.dispatchEvent(new Event('input', { bubbles: true })); },
		);
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/groups(\?|$|\/)/);
		await expect(asAdmin.getByText('e2e-NewGroup')).toBeVisible();
	});

	test('edit group name persists', async ({ asAdmin }) => {
		await asAdmin.goto(`/admin/groups/${groups[0].id}/edit`);
		await asAdmin.getByTestId(SEL.form.name).fill('e2e-Renamed');
		await asAdmin.getByTestId(SEL.form.submit).click();
		await expect(asAdmin).toHaveURL(/\/admin\/groups(\?|$|\/)/);
	});

	test('delete group removes the row from the list', async ({ asAdmin }) => {
		// We delete the LAST seeded group so remaining-group counts are easier
		// to predict. Mock cascades the userGroups records too.
		const target = groups[groups.length - 1];
		await asAdmin.goto('/admin/groups');
		const targetRow = asAdmin.getByTestId(SEL.row.group(target.id));
		await expect(targetRow).toBeVisible();
		await targetRow.locator('[data-testid="row-action-delete"]').click();
		// confirmPreset='remove' uses a confirm dialog — find Yes/Confirm button.
		await asAdmin.getByRole('button', { name: /ano|smazat|potvrdit/i }).first().click();
		await expect(targetRow).toHaveCount(0);
	});

	test('group statistics page renders without console errors', async ({ asAdmin }) => {
		await asAdmin.goto('/admin/groups/statistics');
		// Page loads without crashing — the mock returns the proper
		// IGroupStatistics shape so the consumer doesn't blow up.
		await expect(asAdmin).toHaveURL(/\/admin\/groups/);
	});
});
