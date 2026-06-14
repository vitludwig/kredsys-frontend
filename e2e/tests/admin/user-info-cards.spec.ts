import { Page } from '@playwright/test';
import { test, expect } from '../../support/personas';
import { SEL } from '../../support/selectors';
import { authAdapter } from '../../fixtures/auth-adapter';
import {
	place1, expiredCardUser, evaUser, luciaUser, expiredCard, blockedCard,
} from '../../fixtures/data';

const UI = SEL.userInfo;
const UC = SEL.userCard;

async function openProfile(page: Page, user: { id: number; name: string }): Promise<void> {
	await authAdapter.selectPlace(page, place1.id);
	await page.goto('/admin/user-info');
	await page.getByTestId(UI.search).fill(user.name.slice(0, 5));
	await page.waitForResponse(r => r.url().includes('/users') && r.status() === 200);
	await page.getByTestId(UI.userOption(user.id)).click();
	await expect(page.getByTestId(UI.memberId)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Expiration display + edit
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — card expiration', () => {
	test('an expired card shows its date and an expired marker', async ({ asAdmin }) => {
		await openProfile(asAdmin, expiredCardUser);
		const exp = asAdmin.getByTestId(UC.exp(expiredCard.id));
		await expect(exp).toBeVisible();
		await expect(exp).toContainText('01.01.2020');
		await expect(exp).toContainText('vypršela');
	});

	test('editing the expiration to a future date clears the expired marker', async ({ asAdmin }) => {
		await openProfile(asAdmin, expiredCardUser);

		await asAdmin.getByTestId(UC.edit(expiredCard.id)).click();
		const dialog = asAdmin.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await dialog.getByTestId(UC.expirationInput).fill('2099-06-01T10:00');

		const putResp = asAdmin.waitForResponse(
			r => /\/cards\/\d+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
		);
		await dialog.getByTestId(UC.expirationSave).click();
		await putResp;

		const exp = asAdmin.getByTestId(UC.exp(expiredCard.id));
		await expect(exp).toContainText('01.06.2099');
		await expect(exp).not.toContainText('vypršela');
	});

	test('clearing the expiration shows "bez expirace"', async ({ asAdmin }) => {
		await openProfile(asAdmin, expiredCardUser);

		await asAdmin.getByTestId(UC.edit(expiredCard.id)).click();
		const dialog = asAdmin.getByRole('dialog');
		await expect(dialog).toBeVisible();

		const putResp = asAdmin.waitForResponse(
			r => /\/cards\/\d+$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
		);
		await dialog.getByRole('button', { name: 'Vymazat expiraci' }).click();
		await putResp;

		await expect(asAdmin.getByTestId(UC.exp(expiredCard.id))).toContainText('bez expirace');
	});
});

// ---------------------------------------------------------------------------
// Blocked cards + unblock
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — blocked cards', () => {
	test('a blocked card is listed with an Odblokovat action', async ({ asAdmin }) => {
		await openProfile(asAdmin, evaUser);
		const row = asAdmin.getByTestId(UC.row(blockedCard.id));
		await expect(row).toBeVisible();
		await expect(row).toContainText('Zablokována');
		await expect(asAdmin.getByTestId(UC.unblock(blockedCard.id))).toBeVisible();
	});

	test('unblocking a card flips it back to active', async ({ asAdmin }) => {
		await openProfile(asAdmin, evaUser);

		const unblockResp = asAdmin.waitForResponse(
			r => /\/cards\/\d+\/unblock$/.test(r.url()) && r.request().method() === 'PUT' && r.ok(),
		);
		await asAdmin.getByTestId(UC.unblock(blockedCard.id)).click();
		await unblockResp;

		const row = asAdmin.getByTestId(UC.row(blockedCard.id));
		await expect(row).toContainText('Aktivní');
		await expect(asAdmin.getByTestId(UC.block(blockedCard.id))).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Add-card guard (only one active expiring card at a time)
// ---------------------------------------------------------------------------

test.describe('Admin / user-info — add-card guard', () => {
	test('add is disabled while an active card carries an expiration', async ({ asAdmin }) => {
		await openProfile(asAdmin, luciaUser); // active card WITH a future expiration
		await expect(asAdmin.getByTestId(UC.add)).toBeDisabled();
	});

	test('add is enabled when no active card has an expiration', async ({ asAdmin }) => {
		await openProfile(asAdmin, evaUser); // active card (no expiration) + a blocked card
		await expect(asAdmin.getByTestId(UC.add)).toBeEnabled();
	});
});
