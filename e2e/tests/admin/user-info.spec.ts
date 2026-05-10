import { Page } from '@playwright/test';
import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { memberUser, janaUser, users } from '../../fixtures/data';
import { groups } from '../../fixtures/data';
import { authAdapter } from '../../fixtures/auth-adapter';
import { place1 } from '../../fixtures/data';

const UI = SEL.userInfo;
const group1 = groups[0]; // VIP   id:1
const group2 = groups[1]; // Staff id:2
const group3 = groups[2]; // Návštěvníci id:3
const tomasUser = users[6]; // id:7, no groups

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function openProfile(page: Page, user: typeof memberUser): Promise<void> {
	await authAdapter.selectPlace(page, place1.id);
	await page.goto('/admin/user-info');
	await page.getByTestId(UI.search).fill(user.name.slice(0, 5));
	await page.waitForResponse(r => r.url().includes('/users') && r.status() === 200);
	await page.getByTestId(UI.userOption(user.id)).click();
	// Wait until profile has loaded (member-id is rendered by the profile component)
	await expect(page.getByTestId(UI.memberId)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Profile display
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — profile display', () => {
	test('shows name, email, and member ID', async ({ asAdmin }) => {
		await openProfile(asAdmin, memberUser);
		await expect(asAdmin.getByText(memberUser.name)).toBeVisible();
		await expect(asAdmin.getByText(memberUser.email ?? '')).toBeVisible();
		await expect(asAdmin.getByTestId(UI.memberId)).toContainText(String(memberUser.memberId));
	});

	test('user in one group shows that group chip', async ({ asAdmin }) => {
		await openProfile(asAdmin, memberUser); // groups: [1 VIP]
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).toContainText(group1.name);
	});

	test('user in multiple groups shows all group chips', async ({ asAdmin }) => {
		await openProfile(asAdmin, janaUser); // groups: [1 VIP, 2 Staff]
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).toContainText(group1.name);
		await expect(asAdmin.getByTestId(UI.groupChip(group2.id))).toContainText(group2.name);
	});

	test('user without groups shows no group chips', async ({ asAdmin }) => {
		await openProfile(asAdmin, tomasUser); // no groups
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).not.toBeAttached();
	});

	test('group select shows only groups not yet assigned', async ({ asAdmin }) => {
		await openProfile(asAdmin, janaUser); // groups: [1, 2] → only group 3 available
		await asAdmin.getByTestId(UI.groupSelect).click({ force: true });
		await expect(asAdmin.getByTestId(`profile-group-option-${group3.id}`)).toBeVisible();
		await expect(asAdmin.getByTestId(`profile-group-option-${group1.id}`)).not.toBeAttached();
		await expect(asAdmin.getByTestId(`profile-group-option-${group2.id}`)).not.toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// Add group
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — add group', () => {
	test('confirm button is disabled until a group is selected', async ({ asAdmin }) => {
		await openProfile(asAdmin, tomasUser);
		await expect(asAdmin.getByTestId(UI.groupAddBtn)).toBeDisabled();
	});

	test('adding a group shows the new chip after refresh', async ({ asAdmin }) => {
		await openProfile(asAdmin, tomasUser); // starts with no groups
		await asAdmin.getByTestId(UI.groupSelect).click({ force: true });
		await asAdmin.getByTestId(`profile-group-option-${group1.id}`).click();

		const addReq = asAdmin.waitForResponse(
			r => r.url().includes(`/groups/${group1.id}/users/`) && r.request().method() === 'POST' && r.ok(),
		);
		await asAdmin.getByTestId(UI.groupAddBtn).click();
		await addReq;

		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).toContainText(group1.name);
	});

	test('after adding, the added group disappears from the select', async ({ asAdmin }) => {
		await openProfile(asAdmin, tomasUser);
		await asAdmin.getByTestId(UI.groupSelect).click({ force: true });
		await asAdmin.getByTestId(`profile-group-option-${group1.id}`).click();
		await asAdmin.getByTestId(UI.groupAddBtn).click();
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).toBeVisible();

		// Open select again — group1 must no longer be an option
		await asAdmin.getByTestId(UI.groupSelect).click({ force: true });
		await expect(asAdmin.getByTestId(`profile-group-option-${group1.id}`)).not.toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// Remove group
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — remove group', () => {
	test('clicking X on a group chip removes the chip after refresh', async ({ asAdmin }) => {
		await openProfile(asAdmin, memberUser); // groups: [1 VIP]
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).toBeVisible();

		const removeReq = asAdmin.waitForResponse(
			r => r.url().includes(`/groups/${group1.id}/users/`) && r.request().method() === 'DELETE' && r.ok(),
		);
		await asAdmin.getByTestId(UI.groupRemove(group1.id)).click();
		await removeReq;

		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).not.toBeAttached();
	});

	test('after removing, the group reappears in the select', async ({ asAdmin }) => {
		await openProfile(asAdmin, memberUser); // groups: [1 VIP]
		await asAdmin.getByTestId(UI.groupRemove(group1.id)).click();
		await expect(asAdmin.getByTestId(UI.groupChip(group1.id))).not.toBeAttached();

		// group1 should now be available in the select
		await asAdmin.getByTestId(UI.groupSelect).click({ force: true });
		await expect(asAdmin.getByTestId(`profile-group-option-${group1.id}`)).toBeVisible();
	});
});
