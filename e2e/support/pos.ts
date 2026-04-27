import { Page, expect } from '@playwright/test';
import { SEL } from './selectors';
import { MSG } from './messages';

/**
 * Picks an existing user's card from the debug dropdown.
 *
 * Waits for the CDK overlay panel to attach before clicking the option —
 * `mat-option` lives in a portal that animates in after the trigger click,
 * and clicking too early dismisses the panel.
 */
export async function scanCard(page: Page, userName: string): Promise<void> {
	await page.getByTestId(SEL.cardLoader.userSelect).click();
	const panel = page.locator('.mat-mdc-select-panel, [role="listbox"]').first();
	await expect(panel).toBeVisible();
	await panel.getByRole('option', { name: userName, exact: true }).click();
	await expect(panel).toBeHidden();
	await expect(page.getByText(MSG.cardLoader.scanCard, { exact: true })).toBeHidden();
}

/**
 * Simulates a new card scan by injecting a known UID before the component's
 * "simulate new card" button is clicked. Reads `window.__E2E_NEXT_CARD_UID__`
 * (component override) — falls back to Math.random override for compatibility.
 */
export async function scanNewCard(page: Page, uid: number): Promise<void> {
	await page.evaluate((u: number) => {
		// Primary path — read by the component's debug branch when set.
		(window as any).__E2E_NEXT_CARD_UID__ = u;
		// Fallback for older component versions: deterministic Math.random
		// inverse. Note: only good for one call; replaced on next scan.
		const target = (u - 1_000_000_000) / 9_000_000_000;
		const orig = Math.random;
		(Math as any).random = () => {
			(Math as any).random = orig; // restore after first read
			return Math.max(0, Math.min(0.999_999_999_9, target));
		};
	}, uid);
	await page.getByTestId(SEL.cardLoader.newCard).click();
}

export async function addToBasket(page: Page, goodsId: number): Promise<void> {
	await page.getByTestId(SEL.pos.goodsTile(goodsId)).click();
}

export async function submitOrder(page: Page): Promise<void> {
	await page.getByTestId(SEL.pos.submit).click();
}
