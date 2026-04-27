import { Page } from '@playwright/test';
import { MODE } from '../fixtures/auth-adapter';

const E2E_PREFIX = 'e2e-';

/**
 * Hostnames where destructive cleanup is allowed. Anything else aborts.
 * Override via E2E_ALLOWED_HOSTS=host1,host2 (comma-separated). Production
 * or staging hosts must NEVER be added here without an explicit second-factor
 * env var (E2E_ALLOW_DESTRUCTIVE=1) — see assertCleanupTarget().
 */
const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

function getAllowedHosts(): Set<string> {
	const extra = (process.env['E2E_ALLOWED_HOSTS'] ?? '')
		.split(',')
		.map(s => s.trim())
		.filter(Boolean);
	return new Set([...DEFAULT_ALLOWED_HOSTS, ...extra]);
}

function assertCleanupTarget(targetUrl: string): void {
	let host: string;
	try {
		host = new URL(targetUrl).hostname;
	} catch {
		throw new Error(`[e2e cleanup] cannot parse target URL: ${targetUrl}`);
	}
	const allowed = getAllowedHosts();
	if (allowed.has(host)) return;
	if (process.env['E2E_ALLOW_DESTRUCTIVE'] === '1') {
		console.warn(`[e2e cleanup] destructive cleanup against non-default host '${host}' (E2E_ALLOW_DESTRUCTIVE=1)`);
		return;
	}
	throw new Error(
		`[e2e cleanup] refused to delete entities on host '${host}'. ` +
		`Allowed: ${[...allowed].join(', ')}. ` +
		`To override, set E2E_ALLOWED_HOSTS or E2E_ALLOW_DESTRUCTIVE=1.`,
	);
}

/**
 * Removes any entity whose name starts with `e2e-` from the backend.
 * Called after each test in real mode. No-op in mock mode (state is per-test).
 *
 * Safety:
 * - reads JWT from `apiToken` (the key the app actually uses)
 * - aborts unless target hostname is in the allowlist
 * - paginates through all results (no leak past page 1)
 * - logs failures via console.warn (no silent swallowing)
 */
export async function cleanupE2eEntities(page: Page): Promise<void> {
	if (MODE !== 'real') return;

	const targetUrl = page.url();
	if (!targetUrl || targetUrl === 'about:blank') return;
	assertCleanupTarget(targetUrl);

	const token = await page.evaluate(() => localStorage.getItem('apiToken'));
	if (!token) {
		console.warn('[e2e cleanup] no apiToken in localStorage — skipping (test may not have authenticated)');
		return;
	}

	const headers = { Authorization: token };
	const endpoints = ['users', 'places', 'goods', 'goodstypes', 'currencies', 'groups'];
	const pageSize = 200;

	for (const ep of endpoints) {
		let pageNum = 1;
		// hard cap to avoid infinite loops if the backend returns malformed pagination
		while (pageNum < 100) {
			try {
				const res = await page.request.get(
					`/api/v1.1/${ep}?page=${pageNum}&pageSize=${pageSize}`,
					{ headers },
				);
				if (!res.ok()) {
					console.warn(`[e2e cleanup] ${ep} list ${res.status()} — stopping`);
					break;
				}
				const json = await res.json();
				const items = (json.data ?? json) as Array<{ id: number; name?: string; code?: string }>;
				if (!items || items.length === 0) break;

				for (const item of items) {
					const label = item.name ?? item.code ?? '';
					if (label.startsWith(E2E_PREFIX)) {
						const del = await page.request.delete(`/api/v1.1/${ep}/${item.id}`, { headers });
						if (!del.ok()) {
							console.warn(`[e2e cleanup] DELETE ${ep}/${item.id} -> ${del.status()}`);
						}
					}
				}

				if (items.length < pageSize) break;
				pageNum += 1;
			} catch (e) {
				console.warn(`[e2e cleanup] ${ep} page ${pageNum} failed:`, (e as Error).message);
				break;
			}
		}
	}
}
