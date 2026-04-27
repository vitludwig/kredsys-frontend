import { Page, expect } from '@playwright/test';
import { SEL } from './selectors';

/** Submits the login form via the actual UI. */
export async function uiLogin(page: Page, email: string, password: string): Promise<void> {
	await page.getByTestId(SEL.login.email).fill(email);
	await page.getByTestId(SEL.login.password).fill(password);
	await page.getByTestId(SEL.login.submit).click();
}

/** Opens the side drawer (where logout / nav links live). */
export async function openSideMenu(page: Page): Promise<void> {
	await page.getByTestId(SEL.topMenu.toggle).click();
	// Wait for the drawer animation to settle so subsequent clicks land.
	await expect(page.locator('mat-drawer.mat-drawer-opened').first()).toBeVisible();
}

/**
 * Expands the Admin sub-menu in the side drawer (the admin nav-* testids
 * are conditionally rendered behind `@if (adminMenuOpened)`).
 */
export async function openAdminMenu(page: Page): Promise<void> {
	const toggle = page.getByTestId(SEL.nav.adminToggle);
	if (!(await toggle.isVisible())) {
		await openSideMenu(page);
	}
	await toggle.click();
}
