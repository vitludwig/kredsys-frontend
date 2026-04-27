import { Page } from '@playwright/test';

/**
 * Installs browser-API stubs needed for the app to boot under headless
 * Chromium in either mock or real mode. Must run BEFORE the first navigation
 * (called from a Playwright auto-fixture).
 *
 * Currently:
 * - `navigator.bluetooth` — headless Chromium has none; `PrintService`
 *   instantiates `WebBluetoothReceiptPrinter` at startup and crashes the
 *   app without a stub. This must run in real mode too, otherwise real-mode
 *   E2E is dead on first navigation.
 */
export async function installBrowserShims(page: Page): Promise<void> {
	await page.addInitScript(() => {
		if (!('bluetooth' in navigator)) {
			Object.defineProperty(navigator, 'bluetooth', {
				configurable: true,
				value: {
					addEventListener: () => {},
					removeEventListener: () => {},
					requestDevice: async () => { throw new Error('bluetooth disabled in E2E'); },
				},
			});
		}
	});
}
