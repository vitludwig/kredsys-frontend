# E2E Foundation Review — Parity, Flakiness, and CI Readiness

## Executive summary

This is a clean-looking foundation with several deep, structural problems that will bite the moment the suite leaves a developer's laptop. The single biggest defect is that **mock-mode and real-mode are silently asymmetric**: the Web Bluetooth stub, the JWT injection model, the `selectPlace` semantics, and the `cleanupE2eEntities` token key all behave differently between modes — meaning the real-mode pipeline is dead from day one and any green run on `playwright.config.real.ts` would be illusory. Beneath that, the suite carries a textbook collection of Playwright flakiness traps: a module-level `routes` array that double-registers handlers under `fullyParallel: true`, init-script ordering races between `loginAs` and `selectPlace`, `addInitScript` accumulation across test re-entries, an `actionTimeout`/`expect.timeout` that is too short for a cold CI runner, no per-test storage cleanup, an `Math.random` override that doesn't survive reloads, and a regex-anchorless URL assertion that matches `/wholesale`. The findings below are ordered by severity within thematic groups.

---

## 1. Real mode is dead on arrival — Bluetooth stub only installed in mock mode

- **Severity**: critical
- **Location**: `e2e/fixtures/api-mock.ts:90-104`, `e2e/support/personas.ts:21-28`
- **Failure mode**: every test in `E2E_MODE=real`. The `mockState` fixture short-circuits to `null` and never calls `installApiMock`, so the `navigator.bluetooth` `addInitScript` is never registered. `PrintService` instantiates `WebBluetoothReceiptPrinter` at app startup (`src/app/modules/sale/services/print/print.service.ts`) and the page throws on first navigation under headless Chromium, which has no Web Bluetooth.
- **Why it matters**: real-mode CI will fail before a single assertion runs, but because the failure manifests as a generic page error (not a Playwright API error) it will look like an app bug. Hours wasted bisecting a backend that is fine.
- **Fix**: hoist the Bluetooth stub into a separate fixture (e.g. `browserShims`) that runs unconditionally on the `page` fixture in both modes:

```ts
// e2e/support/personas.ts
browserShims: [async ({ page }, use) => {
  await page.addInitScript(() => {
    if (!('bluetooth' in navigator)) {
      Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
        addEventListener: () => {}, removeEventListener: () => {},
        requestDevice: async () => { throw new Error('bluetooth disabled in E2E'); },
      }});
    }
  });
  await use();
}, { auto: true }],
```

Then strip the bluetooth block out of `installApiMock`.

---

## 2. Module-level `routes` array shared across every worker and every `installApiMock` call

- **Severity**: critical
- **Location**: `e2e/fixtures/api-mock.ts:65-69`, side-effect import in `e2e/support/personas.ts:7`
- **Failure mode**: appears under any of: `fullyParallel: true` in same process (workers run in separate processes so this is per-worker, but multiple `mockState` fixtures within the same worker append again), `--repeat-each=N`, retries (`retries: 2` on CI), `test.describe.parallel` reuse, or any future code that calls `installApiMock` twice. Each call to `import '../fixtures/api-mock-handlers'` is module-cached, so handlers register **once per worker process** — fine — **but** the `routes` array is still global and a single module run registers ~80 handlers; the first matching handler wins via linear `for` scan, so any `on(...)` call that ever fires twice (e.g. if a future test imports a different handler set, or if hot-reload during `--ui` re-evaluates) silently doubles entries and the second registration becomes dead code. The `routes` array is also never reset between tests, so a test that needs to override a handler (e.g. simulate a 500) cannot — there is no `routes.unshift` or scoped registry.
- **Why it matters**: the API mock is a global singleton dressed up as a fixture. The minute someone writes `test('handles 500 on POST users', ...)` and tries to inject a fault, they will find that there's no override mechanism and that injecting one will leak into every other test in the worker. False confidence: tests that look isolated are not.
- **Fix**: make the route registry per-`MockState`. Either pass `state` into `on()` and store handlers on `state`, or expose `installApiMock` returning an object with `override(method, pattern, handler)` that prepends to a per-page registry. Concretely:

```ts
export interface MockApi { state: MockState; override(m: string, p: RegExp, h: Handler): void; }
export async function installApiMock(page: Page): Promise<MockApi> {
  const state = createMockState();
  const localRoutes: RouteEntry[] = [];
  await page.route('**/api/v1.1/**', async route => {
    // try localRoutes first, then global routes
    ...
  });
  return { state, override: (m, p, h) => localRoutes.unshift({ method: m, pattern: p, handler: h }) };
}
```

---

## 3. `addInitScript` accumulation: `loginAs` + `selectPlace` + retries stack

- **Severity**: critical
- **Location**: `e2e/fixtures/auth-adapter.ts:53-58, 64-68`, called from `e2e/support/personas.ts:32-56`
- **Failure mode**: every navigation re-evaluates **all** previously-added init scripts. In `asWorker`, two scripts are added (login then place); on a Playwright retry of the same test the fixture re-runs and adds **two more** scripts to the same `BrowserContext`. Over `retries: 2` you can have up to 6 init scripts, and each later `loginAs` writes its own `apiToken` last, but if the order ever flips (e.g. someone refactors `selectPlace` to `loginAs+selectPlace+loginAs`) the wrong token wins. Worse, each navigation pays the cost of running every accumulated script.
- **Why it matters**: silent flakiness, especially with retries. Token from a previous attempt's `loginAs` lingers in `localStorage` and the retry "passes" against stale auth. Debugging is brutal because `localStorage` looks correct on inspection.
- **Fix**: Playwright contexts are reused per-test by default in workers; ensure `addInitScript` is only called on a fresh context. The clean approach is to switch to a single `addInitScript` that consumes a `window.__E2E__` object set via `page.addInitScript({ content: ... })` after a `context.clearCookies()` + `context.addInitScript` reset. Simpler: restructure to use `storageState` (write JSON file once, point `use.storageState` at it). At minimum, clear `localStorage` in `beforeEach`:

```ts
test.beforeEach(async ({ page }) => {
  await page.context().addInitScript(() => localStorage.clear());
});
```

(But that itself accumulates — see finding #4.)

---

## 4. `MockAuthAdapter.loginAs` computes `exp` once at fixture install — long tests get expired tokens

- **Severity**: major
- **Location**: `e2e/fixtures/auth-adapter.ts:40-46`
- **Failure mode**: `exp = now + 3600s` is computed in node-side fixture code and then frozen into the JWT body. The JWT is then injected by `addInitScript`, which runs on every navigation. A test that runs > 1 hour after fixture setup (long test in `--ui` mode, paused via `pause()`, slow CI under load, or simply a worker that reuses context across many tests) gets a stale `exp`. Auth interceptor / guards may treat the token as expired and redirect to login mid-test.
- **Why it matters**: extremely hard to reproduce. Looks like a flake. The `exp` check is also typically tolerant, so this only fires past the 1h mark — exactly when CI is slow.
- **Fix**: pass user data only and mint the JWT inside the init script, or set `exp = now + 24h`. Better: inject `exp` as `null` in mock mode and have the mock auth skip exp validation. Simplest patch:

```ts
exp: Math.floor(Date.now() / 1000) + 24 * 3600,
```

---

## 5. `selectPlace` race: init-script-only mock vs eager-navigation real

- **Severity**: critical (parity)
- **Location**: `e2e/fixtures/auth-adapter.ts:61-68` vs `:96-99`, `e2e/support/personas.ts:37-42`
- **Failure mode**: in mock mode `selectPlace` only registers an `addInitScript`. The script doesn't fire until the next `page.goto`. In real mode `selectPlace` itself calls `page.goto('/place-select')` and clicks. So `asWorker` semantics differ:
  - mock: after fixture, page is still `about:blank`; first `goto('/sale')` in the test will run both init scripts and land on `/sale` — **assuming** the place gets picked up before any auth guard or place guard fires.
  - real: after fixture, page is **already** on `/sale` (or wherever the click took it).
  Tests written against the mock-mode mental model (e.g. `await asWorker.goto('/sale')`) are no-ops in real mode and may invalidate the place selection; tests written against real-mode (no `goto('/sale')` needed) silently land on `about:blank` in mock mode.
- **Why it matters**: this is the textbook "tests pass in mock, fail in real" trap. Plus, on retry, the real-mode adapter calls `page.goto('/place-select')` again on an already-authenticated page — depending on guard behaviour this may or may not work.
- **Fix**: pick one semantics. Recommended: both adapters should set state without navigating, returning before any goto. The test owns navigation. The `RealAuthAdapter` should call the place-selection endpoint via `page.request` (same as login) instead of clicking through UI:

```ts
// real
async selectPlace(page, placeId) {
  const res = await page.request.post(`/api/v1.1/places/${placeId}/login`, { headers: { Authorization: `Bearer ${token}` }});
  const { placeToken } = await res.json();
  await page.addInitScript((d) => { localStorage.setItem('selectedPlaceId', d.id); localStorage.setItem('placeToken', d.t); }, { id: String(placeId), t: placeToken });
}
```

---

## 6. `cleanupE2eEntities` reads the wrong `localStorage` key

- **Severity**: critical (real mode)
- **Location**: `e2e/support/cleanup.ts:13`
- **Failure mode**: the auth adapter writes `localStorage.setItem('apiToken', ...)` (auth-adapter.ts:55, 90), but cleanup reads `localStorage.getItem('token')`. Always returns `null`, the `if (!token) return` short-circuits, **no cleanup ever runs in real mode**.
- **Why it matters**: the entire point of cleanup is to keep real-mode E2E from polluting a shared backend. After the first failed run, leftover `e2e-*` users/places accumulate forever, and subsequent runs collide on unique constraints (email, code, name) until someone manually purges the DB.
- **Fix**: change to `localStorage.getItem('apiToken')`. Add a unit test or assertion in cleanup that throws if the token is missing, instead of a silent return — silent failures here are how the production DB ends up with thousands of `e2e-*` rows.

---

## 7. `expect(page).toHaveURL(/\/sale|\/place-select/)` matches anything containing `sale`

- **Severity**: major
- **Location**: `e2e/tests/smoke.spec.ts:10`
- **Failure mode**: regex alternation without anchors or grouping. Matches `/wholesale`, `/sales-report`, `/admin/saleshistory`, `https://example.com/?q=sale`. Future routing changes (e.g. adding `/sale-summary`) will silently keep this test green even if the redirect logic is broken.
- **Why it matters**: false confidence. The test name says "lands on /place-select after login"; the assertion validates "URL contains the substring sale OR place-select". A redirect bug that lands the admin on `/wholesale-tools` would pass.
- **Fix**: anchored regex or `RegExp` array:

```ts
await expect(asAdmin).toHaveURL(/\/(sale|place-select)(\?|$|\/)/);
// or
await expect(asAdmin).toHaveURL(/\/place-select($|\?)/);  // be specific
```

---

## 8. `scanCard` clicks `getByRole('option', { name })` — Material option role race

- **Severity**: major
- **Location**: `e2e/support/pos.ts:7-10`
- **Failure mode**: Angular Material's `mat-option` is rendered into a CDK overlay panel that is created *after* the `mat-select` is clicked. The animation (200ms default) and the CDK portal attachment can mean `role="option"` is briefly resolvable on a stale or transitioning DOM. With `actionTimeout: 10_000` this usually wins, but on a slow CI runner under load (cold V8, GC pause) the click fires before the overlay is interactive and silently dismisses the panel. Subsequent `expect(...toBeHidden())` then waits 5s for "Načtěte kartu" to disappear, fails, and Playwright reports "element not found" rather than the actual race.
- **Why it matters**: classic Material flake. The `expect(...).toBeHidden()` afterward is a half-fix that confirms the dropdown closed but doesn't gate option visibility.
- **Fix**: explicitly wait for the listbox before clicking the option, and prefer the panel-scoped locator:

```ts
await page.getByTestId(SEL.cardLoader.userSelect).click();
const panel = page.locator('.mat-mdc-select-panel, [role="listbox"]');
await expect(panel).toBeVisible();
await panel.getByRole('option', { name: userName }).click();
await expect(panel).toBeHidden();           // wait for close animation
await expect(page.getByText(MSG.cardLoader.scanCard)).toBeHidden();
```

---

## 9. `scanNewCard` Math.random override is a footgun in three ways

- **Severity**: major
- **Location**: `e2e/support/pos.ts:13-19`, `card-loader.component.ts:141-143`
- **Failure mode**:
  1. `page.evaluate` runs once on the **current** page; any reload, navigation, or HMR (in `--ui` mode) wipes the override. The next call to `generateRandomCardId()` returns a real random number.
  2. `Math.random` may have already been monkey-patched / cached by a library before `scanNewCard` runs (Sentry, error reporting, RxJS scheduler in some setups). Replacing it after-the-fact doesn't reach the cached reference.
  3. The math: `target = (uid - 1_000_000_000) / 9_000_000_000`. With `uid = 1_000_000_000`, `target = 0`; `Math.floor(0 * 9e9) + 1e9 = 1_000_000_000` ✓. With `uid = 9_999_999_999`, `target ≈ 0.999...`; `Math.floor(0.999... * 9e9) + 1e9` — depending on float precision this can land on `9_999_999_998` instead of `9_999_999_999`. Off-by-one because `9_000_000_000` is not exactly representable in the fraction × multiplier round-trip.
- **Why it matters**: deterministic UID is the contract. Any of these silently breaks it and the test sees a different card UID than expected, looking like a backend bug.
- **Fix**: install via `addInitScript` (survives reloads), and bypass the float math by exposing a deterministic generator on `window.__E2E__`:

```ts
await page.addInitScript((u) => { (window as any).__E2E_NEXT_CARD__ = u; }, uid);
// then have the component read window.__E2E_NEXT_CARD__ if present
```

Or, in the component, read an env-injected override when `isDebug && window.__E2E_NEXT_CARD__`. Don't rely on Math.random.

---

## 10. `expect(getByText('Načtěte kartu')).toBeHidden()` — strict mode and partial matches

- **Severity**: minor
- **Location**: `e2e/support/pos.ts:9`
- **Failure mode**: `getByText` uses substring matching by default and is subject to strict-mode violations if the text appears in a tooltip, aria-live region, or screen-reader-only span as well as the visible label. If a future translator changes the string to "Načtěte kartu prosím" or wraps it in `<span>Načtěte <b>kartu</b></span>`, the locator still matches but multiple matches break strict mode and the test fails with `strict mode violation: getByText resolved to N elements` — looks like an app regression, isn't.
- **Fix**: use exact-match or a `data-testid`:

```ts
await expect(page.getByText(MSG.cardLoader.scanCard, { exact: true })).toBeHidden();
// better: add data-testid="card-loader-prompt" and use it
```

---

## 11. `actionTimeout: 10_000` and `expect.timeout: 5_000` are too tight for cold CI

- **Severity**: major
- **Location**: `e2e/playwright.config.ts:12, 19`
- **Failure mode**: a cold CI worker doing `ng serve` from a fresh checkout, first navigation triggers Vite to cold-compile dozens of lazy chunks. First-paint can exceed 5s on a 2-vCPU runner. `mat-select` open + animated overlay + click can exceed 10s if the worker is contended (recall `workers: process.env.CI ? 2 : undefined` — with `fullyParallel: true` you get 2 parallel browsers per worker doing TS compile at once).
- **Why it matters**: the most common CI flake pattern. Fix-by-retry papers over real bugs and inflates run times.
- **Fix**: bump for CI specifically:

```ts
timeout: process.env.CI ? 60_000 : 30_000,
expect: { timeout: process.env.CI ? 10_000 : 5_000 },
use: { actionTimeout: process.env.CI ? 20_000 : 10_000, navigationTimeout: 30_000 },
```

Add `navigationTimeout` (currently inherits from `timeout` and is invisible).

---

## 12. `webServer.timeout: 180_000` and `reuseExistingServer: !process.env['CI']` — cold-start CI risk

- **Severity**: major
- **Location**: `e2e/playwright.config.ts:30-32`
- **Failure mode**: `ng serve` on a cold cache (no `node_modules/.cache/angular`) has been observed to take 4–6 minutes for a project of this size. 180s is below that floor on CI. Worse, `reuseExistingServer: !process.env['CI']` means CI **never** reuses — fine — but locally during retries the server is reused, which can hide stale-build issues. The `cwd: '..'` + relative `--proxy-config src/proxy.conf.json` only works if `npx ng serve` is invoked from the e2e dir's parent — confirm in CI.
- **Why it matters**: first-build CI failures look like infra problems, not E2E problems, and burn an entire CI cycle (2x retries × 6 min wait = 36 minutes) before the actual test even starts.
- **Fix**:
  1. `timeout: 300_000` for CI.
  2. Run `ng build` once and `npx http-server dist/` (or use Angular's prod server) instead of `ng serve` on CI — orders of magnitude faster boot.
  3. Validate the proxy config path is resolvable from `cwd`.

---

## 13. `MODE` is a module-load-time constant — env var changes mid-run are invisible

- **Severity**: major
- **Location**: `e2e/fixtures/auth-adapter.ts:6`, also imported in `e2e/support/cleanup.ts:2`
- **Failure mode**: `export const MODE = process.env['E2E_MODE'] === 'real' ? 'real' : 'mock'` evaluates once when the module is first loaded by Node. If a test runner setup script later sets `process.env.E2E_MODE`, or if `playwright.config.real.ts` only sets it via the Playwright `env` field (which it doesn't — the npm script does), the constant is already frozen. The `playwright.config.real.ts` itself **does not set `E2E_MODE`** — it relies on the npm script `E2E_MODE=real playwright test ...`. If someone runs `npx playwright test --config=e2e/playwright.config.real.ts` directly, `MODE = 'mock'`, the mock adapter runs against a real backend, and tests fail with cryptic 401s.
- **Why it matters**: foot-gun for anyone bypassing `npm run e2e:real`. Also breaks `--ui` mode if env isn't set.
- **Fix**: derive `MODE` from the Playwright config. Pass it in via `use: { mode: 'real' }` and read from `testInfo.project.use.mode` in the fixture. Or have `playwright.config.real.ts` set `process.env.E2E_MODE = 'real'` at the top of the file, before any imports:

```ts
process.env['E2E_MODE'] = 'real';
import baseConfig from './playwright.config';
```

---

## 14. No per-test `localStorage` / `sessionStorage` cleanup

- **Severity**: major
- **Location**: `e2e/support/personas.ts` (no `beforeEach` cleanup), `e2e/playwright.config.ts` (no `storageState` reset)
- **Failure mode**: Playwright creates a fresh `BrowserContext` per test by default, so cookies and storage are clean. **However**, with `addInitScript` the previous test's scripts have already populated `localStorage` *via the init script*, not via the page itself, so a clean context still gets populated on first navigation — that's the intended path. The problem is that the `isDebug` flag (`localStorage.setItem('isDebug','true')`) sticks across tests within the same context. Now consider a future test that sets `isDebug: false` via a fresh `loginAs(..., { debug: false })` — the *new* init script writes nothing for `isDebug` (the code path is `if (data.debug) localStorage.setItem(...)`), so the *previous* `'true'` value persists if the same context is reused. Currently contexts aren't reused, but `test.use({ storageState: ... })` or any future optimisation that reuses contexts will surface this.
- **Why it matters**: a latent bug; surfaces under any context-reuse optimisation.
- **Fix**: write `isDebug` unconditionally — `localStorage.setItem('isDebug', String(!!data.debug))` — or `removeItem` on the false branch. Same for any other optional flags.

---

## 15. URL pattern `**/api/v1.1/**` and path normalization assume exact API version

- **Severity**: major
- **Location**: `e2e/fixtures/api-mock.ts:106, 109`
- **Failure mode**: `path = url.pathname.replace(/^.*\/api\/v1\.1\//, '')` — if the proxy ever rewrites to `/api/v1.2/` or some intermediate (e.g. an API gateway adding `/internal/api/v1.1/`), the regex still strips, but if it rewrites to a non-versioned path like `/backend/api/v1/`, the route still intercepts (`**/api/v1.1/**` glob), the replace **does not match**, and `path` stays as the full URL. Then `matchRoute` walks all patterns against e.g. `http://localhost:4200/api/v1.1/users`, all `^users$` patterns fail, and you get 404 on every call. Conversely, if the front-end calls **without** the `/api/v1.1/` prefix (a relative call that happens to hit the same baseURL), the route doesn't match at all and Playwright passes through to the network, failing in mock mode.
- **Why it matters**: silent 404 storm. Tests fail with `[mock] unhandled GET ...` warnings that are easy to miss.
- **Fix**: use `route.continue()` or fail-loud:

```ts
if (!matched) {
  console.error(`[mock] UNHANDLED ${req.method()} ${path} — failing test`);
  return route.fulfill({ status: 599, body: JSON.stringify({ error: `mock 404: ${path}` })});
}
```

A 599 + a `test.fail()` hook on console.error makes unhandled routes break the build instead of silently degrading.

---

## 16. `card-loader.component.spec.ts` uses double `await whenStable()` — symptom of an untested async chain

- **Severity**: minor
- **Location**: `src/app/common/components/card-loader/card-loader.component.spec.ts:96-101`
- **Failure mode**: the spec relies on `await fixture.whenStable(); await fixture.whenStable(); fixture.detectChanges();` to drain `ngOnInit`. The component's `ngOnInit` (lines 78-110 of `card-loader.component.ts`) chains `getCards` → `Promise.all(getUser(...))` — two awaits. The double `whenStable` happens to drain both. If a third async step is added (e.g. `getGroups`), the test will silently pass with stale `allUserCards = []` because the assertion runs before the third microtask flushes.
- **Why it matters**: brittle. New developers will copy-paste the double `whenStable` pattern, accumulating it without understanding why.
- **Fix**: use `fakeAsync` + `tick()` and `flushMicrotasks()`, or loop until stable:

```ts
async function fullyStable(fixture) {
  let stable = false;
  for (let i = 0; i < 10 && !stable; i++) {
    await fixture.whenStable();
    fixture.detectChanges();
    stable = !fixture.isStable();  // inverse — keep looping while unstable
  }
}
```

Or better, refactor `ngOnInit` to a single `await` over a method that does all the work, exposed for tests.

---

## 17. `card-loader.component.ts` `ngOnInit` lacks error handling

- **Severity**: minor
- **Location**: `src/app/common/components/card-loader/card-loader.component.ts:78-110`
- **Failure mode**: `await this.cardsService.getCards(...)` throws → ngOnInit's promise rejects → unhandled rejection → in mock mode, headless Chromium logs to console which Playwright doesn't fail on. In real mode, the same thing happens silently. The component is then in a half-initialised state (`allUserCards = []`) and `scanCard` later fails with an empty option list.
- **Why it matters**: appears as "option not found" flake when the real bug is a backend 500.
- **Fix**: wrap the debug branch in try/catch and surface via AlertService. Test assertions will now fire on the actual error.

---

## 18. `playwright.config.real.ts` does not validate `E2E_BASE_URL`

- **Severity**: minor
- **Location**: `e2e/playwright.config.real.ts:10`
- **Failure mode**: `baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:4200'`. A typo (`E2E_BASEURL=...`) silently falls back to localhost, the suite "works" against a local stale build, and reports green. On a shared real-env CI job this is dangerous — green tests against the wrong target.
- **Why it matters**: false confidence; potentially destructive if the real-mode cleanup ever points at production.
- **Fix**: assert on startup:

```ts
if (process.env['E2E_MODE'] === 'real' && !process.env['E2E_BASE_URL']) {
  throw new Error('E2E_MODE=real requires E2E_BASE_URL');
}
```

Add an HTTP probe in a `globalSetup` that verifies the target responds and is the expected environment (e.g. fetches a `/health` or `/version` endpoint and asserts a non-prod marker).

---

## 19. `paginated()` mismatch: handlers consume `?page=`, `?pageSize=`, but Angular Material paginator sends `pageIndex` 0-based

- **Severity**: major
- **Location**: `e2e/fixtures/api-mock-handlers.ts:4-9`, comment in `e2e/fixtures/api-mock.ts:81`
- **Failure mode**: the comment says "1-based; Material sends pageIndex+1". `pageParams()` reads `url.searchParams.get('page') ?? 1` and treats missing as `1`. If the actual frontend service translates `pageIndex` to `?page=` (1-based) all is well, but the convention isn't enforced anywhere. If a service ever sends `?page=0` (0-based) the mock returns the **first** page (after `safePage = page < 1 ? 1 : page`) — same as `?page=1` — masking pagination bugs. Tests assert paginated counts but not which slice was returned.
- **Why it matters**: pagination correctness is only checked by total count, not by content. Off-by-one in the real backend won't be caught by mock tests.
- **Fix**: assert that requested page is within bounds and either fail-loud or return an error. At minimum log when `page < 1`.

---

## 20. `forbidOnly: !!process.env['CI']` — but `process.env['CI']` truthiness is brittle

- **Severity**: minor
- **Location**: `e2e/playwright.config.ts:7-9`
- **Failure mode**: `process.env['CI']` set to the string `'false'` is truthy. Some CI systems (older Jenkins, custom GitLab runners) set `CI=false` as an env var. `!!'false'` is `true`, so `forbidOnly` triggers on a developer machine that inherited the env var, and `retries: 2` runs locally too. Conversely, `CI=0` is also truthy. The same pattern is used in `webServer.reuseExistingServer` and `workers`, all with the same bug.
- **Why it matters**: developer confusion; tests randomly retry locally.
- **Fix**: use a strict check.

```ts
const isCI = process.env['CI'] === 'true' || process.env['CI'] === '1';
```

---

## 21. `fullyParallel: true` with shared mock data fixtures — mutation leakage across siblings within a worker

- **Severity**: major
- **Location**: `e2e/fixtures/api-mock.ts:30-43`, `e2e/support/personas.ts:21-28`
- **Failure mode**: each test gets its own `mockState` via `structuredClone(users)` — good. But the **source** arrays (`users`, `places`, `goods`, ...) are imported from `data/*.ts` modules, which are JS objects shared by reference at the module level. `structuredClone` deep-copies, so per-test mutations are isolated. **However**, any handler that does `state.users.push(u)` is fine, but any handler that mutates a shared *imported reference* (e.g. via `Object.assign(users[0], body)` if someone writes `state.users[i] = { ...state.users[i], ...body, id }` — wait, that creates a new object, OK) is poison. Currently safe — but the next person to write a handler doing `Object.assign(state.users[i], body)` will mutate the cloned object only; **but** if they ever import `users` directly from `data/users.ts` to do an "easy lookup" instead of `state.users`, they cross-contaminate every test.
- **Why it matters**: a trap waiting for the next contributor. Mutation safety is implicit; nothing enforces "always go through state".
- **Fix**: deep-freeze the imported data:

```ts
// e2e/fixtures/data/index.ts
export const users = Object.freeze(structuredClone(rawUsers));
```

This makes accidental mutation throw in dev mode immediately.

---

## 22. `MockAuthAdapter` permissions field type mismatch with login response shape

- **Severity**: minor
- **Location**: `e2e/fixtures/auth-adapter.ts:50`, login handler `api-mock-handlers.ts:23-31`
- **Failure mode**: `MockAuthInjection.permissions` is `JSON.stringify(ALL_PERMISSIONS)` — a string. The login response in the mock returns `permissions: []` (an empty array). If the frontend's `AuthService` reads `localStorage.getItem('permissions')` (string) at one path and the login response body (array) at another, two code paths use two different formats. A future refactor that switches AuthService to `JSON.parse(localStorage.getItem('permissions'))` will break tests that bypass login (use `addInitScript` only) because the mock always grants empty permissions on login, and tests that use the login flow get empty permissions whereas tests that use `addInitScript` get all permissions. Mock vs mock parity broken inside mock mode.
- **Why it matters**: subtle. Tests that "log in" and tests that "inject auth" diverge in behaviour.
- **Fix**: have the mock login handler return `permissions: ALL_PERMISSIONS` to the admin user (or per-role) and store as JSON.stringify consistently.

---

## 23. No global hook to warn on unhandled console errors / network failures

- **Severity**: minor
- **Location**: missing — should be in `e2e/support/personas.ts`
- **Failure mode**: the mock logs `[mock] unhandled GET /xxx` but Playwright doesn't fail. Page console errors (Angular runtime exceptions, RxJS unhandled errors, the bluetooth crash) are invisible. Tests pass with a broken app as long as the asserted UI bits happen to render.
- **Why it matters**: the whole point of E2E is to catch app-level breakage. Silent console.error swallowing is the antithesis.
- **Fix**: add a `page` fixture override that listens to `console` and `pageerror`, collects messages, and fails the test if any error-level message was emitted (with an allow-list for known-noisy 3rd parties):

```ts
page: async ({ page }, use, testInfo) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await use(page);
  if (errors.length) testInfo.status === 'passed' && (testInfo.status = 'failed', testInfo.error = { message: errors.join('\n') });
}
```

---

## 24. `videos: 'retain-on-failure'` + `trace: 'on-first-retry'` with `retries: 2` — second retry has no trace

- **Severity**: minor
- **Location**: `e2e/playwright.config.ts:8, 16-18`
- **Failure mode**: `on-first-retry` only enables tracing on retry #1. If the test passes on retry #1 (flake fixed) but fails again on retry #2, you have **no trace** of either the original failure or the second-retry failure. Playwright's docs cover this — pick `retain-on-failure` or `on-all-retries` for trace.
- **Why it matters**: debugging flaky CI failures becomes impossible without a trace.
- **Fix**:

```ts
trace: 'retain-on-failure',
```

---

## 25. Hard-coded Czech locale strings in selectors and assertions

- **Severity**: minor
- **Location**: `e2e/support/messages.ts`, `e2e/support/pos.ts:9`, `e2e/tests/smoke.spec.ts:20`
- **Failure mode**: `'Načtěte kartu'`, `'Marie Členka'` — hard-coded Czech. If the app ever adds i18n with English fallback (or the test locale gets overridden via `?lang=en`), every test that uses `getByText(MSG.cardLoader.scanCard)` or `getByRole('option', { name: 'Marie Členka' })` breaks. The browser locale isn't pinned in `use:` either, so a runner with `LANG=en_US.UTF-8` and a future Accept-Language-aware app breaks too.
- **Why it matters**: brittle to i18n work. Cross-locale users will hit this even now.
- **Fix**: pin locale and timezone in config (also covers timezone-dependent date assertions, which the suite doesn't have yet but will):

```ts
use: { locale: 'cs-CZ', timezoneId: 'Europe/Prague', ... }
```

Prefer `data-testid` selectors over visible-text selectors wherever possible (already done for most; the remaining `getByText` and `getByRole(name)` calls should follow suit).

---

## 26. JWT mock is unsigned and uses a literal `"signature"` string — header `alg: HS256` lies

- **Severity**: minor
- **Location**: `e2e/fixtures/jwt.ts:14-15`
- **Failure mode**: header claims HS256, signature is the literal string `signature`. If the front-end ever adds even a rudimentary signature length check (e.g. base64-decode and verify length), the mock token is rejected. Some JWT libraries throw on malformed signatures during decode. Currently the front-end uses `jwt-decode` which doesn't verify, but `JwtPayload` decoding can fail on the `'signature'` non-base64 string in some implementations.
- **Why it matters**: latent compatibility bomb.
- **Fix**: use `alg: 'none'` and an empty third segment, which is standard for unverified tokens:

```ts
return `${header}.${body}.`;  // header b64({ alg: 'none', typ: 'JWT' })
```

---

## Summary of findings

26 distinct issues. By severity:

- **Critical (5)**: #1 bluetooth-stub-only-in-mock; #2 module-level routes singleton; #3 addInitScript accumulation; #5 selectPlace mock vs real semantic mismatch; #6 cleanup reads wrong localStorage key.
- **Major (11)**: #4 frozen JWT exp; #7 unanchored URL regex; #8 mat-option role race; #9 Math.random override fragility; #11 too-tight CI timeouts; #12 webServer cold-start timeout; #13 MODE module-load constant; #14 missing localStorage reset; #15 path normalization assumes v1.1; #19 paginator off-by-one mask; #21 shared mock data mutation hazard.
- **Minor (10)**: #10 strict-mode getByText; #16 double whenStable; #17 ngOnInit error swallowing; #18 unvalidated E2E_BASE_URL; #20 brittle CI env detection; #22 permissions string-vs-array; #23 no console-error hook; #24 trace on-first-retry only; #25 hard-coded Czech strings; #26 fake JWT signature.

Run on a slow CI runner with `--repeat-each=5`, expect issues #1, #2, #3, #5, #6, #11, #12, and #14 to fire on the very first build. Issues #4, #8, #9, #15, #19 will flake intermittently and burn debugging time. The remaining items are latent risks that will surface as the suite grows.
