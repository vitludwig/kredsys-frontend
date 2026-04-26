import { Page } from '@playwright/test';
import { MODE } from '../fixtures/auth-adapter';

const E2E_PREFIX = 'e2e-';

/**
 * Removes any entity whose name starts with `e2e-` from the backend.
 * Called after each test in real mode. No-op in mock mode (state is per-test).
 */
export async function cleanupE2eEntities(page: Page): Promise<void> {
	if (MODE !== 'real') return;

	const token = await page.evaluate(() => localStorage.getItem('token'));
	if (!token) return;

	const headers = { Authorization: `Bearer ${token}` };
	const endpoints = ['users', 'places', 'goods', 'goodstypes', 'currencies', 'groups'];

	for (const ep of endpoints) {
		try {
			const res = await page.request.get(`/api/v1.1/${ep}`, { headers });
			if (!res.ok()) continue;
			const json = await res.json();
			const items = (json.data ?? json) as Array<{ id: number; name?: string; code?: string }>;
			for (const item of items) {
				const label = item.name ?? item.code ?? '';
				if (label.startsWith(E2E_PREFIX)) {
					await page.request.delete(`/api/v1.1/${ep}/${item.id}`, { headers });
				}
			}
		} catch {
			// best-effort
		}
	}
}
