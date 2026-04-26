import { Page, expect } from '@playwright/test';
import { SEL } from './selectors';
import { MSG } from './messages';

/** Picks an existing user's card from the debug dropdown. */
export async function scanCard(page: Page, userName: string): Promise<void> {
	await page.getByTestId(SEL.cardLoader.userSelect).click();
	await page.getByRole('option', { name: userName }).click();
	await expect(page.getByText(MSG.cardLoader.scanCard)).toBeHidden();
}

/** Generates a deterministic new card UID via Math.random override. */
export async function scanNewCard(page: Page, uid: number): Promise<void> {
	await page.evaluate((u: number) => {
		const target = (u - 1_000_000_000) / 9_000_000_000;
		Math.random = () => target;
	}, uid);
	await page.getByTestId(SEL.cardLoader.newCard).click();
}

export async function addToBasket(page: Page, goodsId: number): Promise<void> {
	await page.getByTestId(SEL.pos.goodsTile(goodsId)).click();
}

export async function submitOrder(page: Page): Promise<void> {
	await page.getByTestId(SEL.pos.submit).click();
}
