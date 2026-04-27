# E2E Foundation - Hostile Test Correctness Review

**Reviewer perspective:** Test correctness & assertion strength.
**Scope:** 16 commits since `9af8de2` on the `redesign` branch.
**Verdict:** The foundation looks tidy on the surface but is riddled with weak
assertions, false-positive traps, locator brittleness, and structural defects
that will silently mask real regressions. Several "tests" prove almost nothing
about the system under test, the cleanup helper would never run, the API mock
state is shared across parallel workers, and the persona fixtures inject auth
data that the real `AuthService` does not actually consume on bootstrap.
Anyone landing this as a foundation will spend the next year debugging
flakes and chasing false greens. Hard reject in current form.

---

## 1. `smoke.spec.ts:7-11` - Tautological URL assertion that passes if either screen renders or routing is broken

- **Severity:** critical
- **Location:** `e2e/tests/smoke.spec.ts:10`
- **Problem:** `await expect(asAdmin).toHaveURL(/\/sale|\/place-select/);` asserts
  a disjunction of "the two screens we expect the user might land on." Either
  one passes. A regression where admin lands on `/sale` despite having no
  place selected (a privilege/redirect bug) is silently accepted. A regression
  where the admin is bounced to `/place-select` despite having one preselected
  is also silently accepted. The comment above the assertion ("admin has no
  preselected place, so the SALE redirect bounces to /place-select") states a
  single expected outcome, but the regex permits both. The test name "admin
  lands on /place-select after login" is also a lie - it does not assert that.
- **Why it matters:** This is the literal definition of an assertion that
  would still pass if the routing logic was completely broken in either
  direction. It cannot detect a regression in the place-redirect guard, which
  is the only behavior the test claims to cover.
- **Fix:** Pick one outcome and assert it precisely:
  ```ts
  await expect(asAdmin).toHaveURL(/\/place-select(\?|$)/);
  ```
  If both outcomes are legitimately possible due to a race, fix the race -
  do not accept-all in the test.

---

## 2. `smoke.spec.ts:18-22` - "Worker can scan a card" test passes even if no customer is loaded

- **Severity:** critical
- **Location:** `e2e/tests/smoke.spec.ts:21`, `e2e/support/pos.ts:9`
- **Problem:** The test claims to verify that "worker can scan a card via debug
  dropdown" and asserts `getByTestId(SEL.topMenu.balance).toBeVisible()`. But
  the `top-menu-balance` element in
  `top-menu.component.html:23` is gated on `customerService.customer$` AND
  `customerService.currencyAccount$` resolving non-nullably. In mock mode,
  selecting `Marie Členka` from the dropdown emits a `uid`, which triggers
  `CustomerService.set(uid)`, which calls
  `GET /api/v1.1/cards/{uid}/user` -> `GET /api/v1.1/users/{id}/accounts`.
  However, `scanCard` (`pos.ts:9`) only waits for `MSG.cardLoader.scanCard`
  to become hidden. That message is inside a div whose class flips on a
  synchronous `customerService.customer$` async pipe - it can become hidden
  *before* the currencyAccount fetch resolves. If the accounts fetch ever
  fails or returns empty (and the mock for `/users/{id}/accounts` will
  return `paginated([], 1, 50)` for a member with no fixture account),
  `top-menu-balance` is never rendered, but the test would have already
  passed past the `scanCard` await. Worse, `toBeVisible()` retries up to
  `expect.timeout` (5000ms) - so under steady-state with no balance, the
  test fails *eventually*, but with a misleading "balance not visible"
  rather than the real cause.
- **Why it matters:** The test does not actually prove the card was scanned -
  it proves only that *some* customer state propagated. If the user's account
  fixture is later removed, the test silently breaks for the wrong reason.
  Conversely, if the dropdown emits `0` (selectDebugUser short-circuits on
  `null`/`undefined` only - `0` would still emit), the existing
  `top-menu-balance` from a previous customer could remain visible from a
  prior selection, masking a regression.
- **Fix:**
  - Wait for the actual network response: `await page.waitForResponse(/\/cards\/\d+\/user/)`.
  - Assert the customer name/memberId is rendered, not a coincidental
    sibling DOM node: `await expect(page.getByText('Marie Členka')).toBeVisible()`.
  - Add a negative-control assertion: `await expect(page.getByText('Načtěte kartu')).toBeHidden()`.

---

## 3. `pos.ts:9` - `scanCard` "hidden" assertion passes on `visibility: hidden` while node is still interactive

- **Severity:** major
- **Location:** `e2e/support/pos.ts:9`,
  `card-loader.component.scss` (`&.hidden { visibility: hidden; }`)
- **Problem:** The card-loader root uses `visibility: hidden` (not `display:
  none`, not removed from DOM). Playwright's `toBeHidden()` does treat
  `visibility: hidden` as hidden, but: (a) the inner heading "Načtěte kartu"
  is still in the layout tree taking up space; (b) `getByText('Načtěte kartu')`
  can match the still-mounted text node in a sibling page state. (c) Most
  importantly, this assertion is the *only* signal `scanCard` waits on, but it
  flips on the synchronous customer pipe before the API responses for
  account/balance complete. The function returns "card scanned" while the
  app is still hydrating. Every subsequent step that needs the customer
  fully loaded races against pending requests.
- **Why it matters:** Classic flake source - tests pass locally, fail under
  CI load when the network stub takes 5ms longer than the synchronous click
  handler. The `scanCard` helper is the foundation of every POS test. Every
  test built on it inherits this race.
- **Fix:** Wait for the actual settled state:
  ```ts
  const userResp = page.waitForResponse(r => /\/cards\/\d+\/user$/.test(r.url()) && r.ok());
  const acctResp = page.waitForResponse(r => /\/users\/\d+\/accounts$/.test(r.url()) && r.ok());
  await page.getByTestId(SEL.cardLoader.userSelect).click();
  await page.getByRole('option', { name: userName }).click();
  await Promise.all([userResp, acctResp]);
  ```

---

## 4. `pos.ts:13-19` - `scanNewCard` Math.random override is broken arithmetic and leaks across tests

- **Severity:** critical
- **Location:** `e2e/support/pos.ts:13-19`,
  `card-loader.component.ts:141-143`
- **Problem:** The component generates IDs via
  `Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000`. The helper
  computes `target = (uid - 1_000_000_000) / 9_000_000_000` and replaces
  `Math.random` to return that constant. Multiple defects:
  1. `Math.floor((target * 9_000_000_000)) + 1_000_000_000` only round-trips
     to `uid` for the inverse computation if `target` is an exact ratio. For
     most caller-supplied uids, it will be off by one or off by floating-point
     ULPs (e.g. `(2_500_000_000 - 1e9) / 9e9 = 0.16666...` truncates).
     Worse, if `uid < 1_000_000_000` or `uid >= 1e10`, target falls outside
     `[0, 1)`, breaking Math.random's contract entirely.
  2. **Math.random is permanently overridden for the rest of the page session.**
     Any subsequent `addToBasket`, animation timing, RxJS jitter, retry-with-jitter,
     or component using random colors all become deterministic-but-wrong.
     Angular Material ripples and `Math.random()`-derived ids in the test will
     all collapse to the same value, possibly causing duplicate-id DOM warnings
     or worse.
  3. No restore mechanism. Subsequent tests using the *same page* (although
     Playwright defaults isolate, addInitScript could leak via stored state)
     would inherit nothing - but anyone who refactors to share a page across
     multiple `scanNewCard` calls would silently get the same uid every time.
- **Why it matters:** The helper is one of four tools in the POS support
  module. Every "register a new card" test uses it, and they are exactly
  the tests that prove the new-customer onboarding flow works. A round-trip
  bug means the assertion `expect(uid).toBe(input)` will pass with a
  different uid than the input, hiding actual onboarding bugs.
- **Fix:** Don't override `Math.random`. Either (a) intercept the
  `POST /users/{id}/card` route and inject the uid server-side, or (b)
  expose a debug-only way to set an explicit uid (input field already
  exists in the design spec). Restore Math.random in either case.

---

## 5. `personas.ts:30-57` - `mockState` fixture is created but never returned to tests; per-test reset is missing

- **Severity:** critical
- **Location:** `e2e/support/personas.ts:30,37,45,53` and
  `e2e/fixtures/api-mock.ts:65,90`
- **Problem:** Two compounding issues:
  1. The persona fixtures take `mockState` but immediately discard it
     (`void mockState;`). Tests have no way to mutate or inspect mock state.
     The persona fixture only exists to trigger `installApiMock`, which is
     fine - except:
  2. **The `routes` array in `api-mock.ts:65` is module-level**. Every call
     to `installApiMock` shares the same handler array. `state` is per-call.
     But in Playwright with `fullyParallel: true` and N workers, each worker
     loads its own copy of the module, but within a worker, every test calls
     `installApiMock` again, registering `page.route(...)` per page. Fine so
     far. However, the side-effect `import '../fixtures/api-mock-handlers';`
     in `personas.ts:7` runs *once per worker process*, populating `routes`.
     If a future test or helper imports the handlers a second time, it
     duplicates them. Worse, the design provides no way to register
     test-local overrides (e.g. force a 500 from `/users` for one test).
- **Why it matters:** The mock layer has no extension story for
  per-test handler overrides, which is the *primary* reason mock layers
  exist (error injection, edge-case payloads). Tests that need a custom
  payload have no choice but to monkey-patch the shared `state` - racy.
  Combined with finding 1, this means error-path tests cannot be written
  cleanly on this foundation, forcing teams to skip them.
- **Fix:** Make `installApiMock` accept a per-test overrides map:
  ```ts
  installApiMock(page, { 'GET users': () => ({ status: 500, body: {} }) })
  ```
  Move handler registration to a factory called per-test, not module-level.
  Expose `mockState` to tests so they can stage data:
  ```ts
  test('low balance shows warning', async ({ asWorker, mockState }) => {
    mockState!.accounts.find(...)!.currentAmount = 5;
    ...
  });
  ```

---

## 6. `cleanup.ts:13` - `localStorage.getItem('token')` reads the wrong key; cleanup is a silent no-op

- **Severity:** critical
- **Location:** `e2e/support/cleanup.ts:13`
- **Problem:** The app stores the JWT under `apiToken` (see
  `auth.service.ts:45-49,88` and the persona injection in
  `auth-adapter.ts:55,90` which writes to `apiToken`, not `token`). Cleanup
  reads `localStorage.getItem('token')` - which is always `null` - and
  early-returns at line 14: `if (!token) return;`. **Real-mode cleanup
  never runs.** The catch-all `try/catch` swallows the error if it ever
  *did* run with a wrong header, so even when fixed, failures are silent.
- **Why it matters:** Real-mode tests will accumulate `e2e-` prefixed
  entities forever, polluting the backend, eventually causing list-pagination
  tests to fail for unrelated reasons, or causing duplicate-name conflicts.
  Worse, the `try/catch {}` on line 31 means even a 500 from the backend
  during cleanup is invisible.
- **Fix:**
  ```ts
  const token = await page.evaluate(() => localStorage.getItem('apiToken'));
  ```
  Remove the silent catch-all, or at minimum log: `} catch (e) { console.error('cleanup', ep, e); }`.

---

## 7. `personas.ts:30-43` - Cleanup runs after `use(page)` but only for some personas; `asMember` skipped silently

- **Severity:** major
- **Location:** `e2e/support/personas.ts:34,42,50,57`
- **Problem:** `asAdmin`, `asWorker`, `asPowerSalesman` all run cleanup; but
  `asMember` (line 53-57) does not. There is no comment or test enforcing
  this asymmetry. If a member-persona test ever creates entities (say, via
  a member-self-edit path), they leak. Additionally, cleanup runs AFTER
  `use(page)` returns - if the test failed mid-flight, cleanup still runs,
  which is fine, but if cleanup itself throws, Playwright reports the
  cleanup error and masks the original test failure. The `cleanupE2eEntities`
  function does not throw (it swallows everything via `try/catch`), so the
  symptom is the opposite: test fails, leak persists, no visible error.
- **Why it matters:** Asymmetric teardown is a recipe for cross-test
  pollution that only surfaces in CI under specific test ordering.
- **Fix:** Run cleanup uniformly for all personas, in an explicit
  `afterEach` hook on the test object, with errors surfaced to the
  console (not swallowed).

---

## 8. `auth-adapter.ts:64-68` - `selectPlace` writes `selectedPlaceId` via `addInitScript`, but `placeService` only reads it from the place-select guard during navigation

- **Severity:** major
- **Location:** `e2e/fixtures/auth-adapter.ts:64-68`,
  `src/app/common/utils/place.guard.ts:15`
- **Problem:** `MockAuthAdapter.selectPlace` enqueues a script via
  `addInitScript` that writes `localStorage.setItem('selectedPlaceId',
  String(p.id))`. But `addInitScript` runs on every navigation, *before*
  any page script. The `placeService.selectedPlace` field is only populated
  by the place guard reading the localStorage value on guard activation -
  so this works *only* on the first navigation. If a test calls
  `page.goto('/')` first (e.g. for `asWorker`, who already has selectPlace
  injected), the guard reads the storage, fetches the place, and sets
  `selectedPlace`. Fine. But the worker fixture in `personas.ts:38-39`
  calls `loginAs` *and* `selectPlace` - both are addInitScript - and *then*
  the test calls `page.goto(...)`. The order in which addInitScripts run is
  insertion order, so login runs first. Both are queued, but the test's
  first navigation is the first time either runs. OK in practice. However:
  - There is no explicit `await page.goto()` inside the fixture itself, so
    if a test forgets to navigate, neither script ever runs and `localStorage`
    is empty. The test would then fail with "no place selected" - which is
    clearer than a silent pass, but it is a confusing failure mode.
  - Real-mode `selectPlace` (line 96-99) does navigate to `/place-select`
    and click a tile, but there is no `await expect(page).toHaveURL(/\/sale/)`
    after the click - the function returns before the redirect resolves,
    leading to races in the very first test step.
- **Why it matters:** The two adapters have fundamentally different
  semantics (one is synchronous storage injection that activates on next nav,
  the other is an interactive UI flow), but the persona fixtures use them
  interchangeably. Mock-mode tests will pass with no explicit nav; real-mode
  tests of the same persona will need an explicit wait.
- **Fix:** Make both adapters block until the place is actually selected:
  ```ts
  // mock
  async selectPlace(...) { /* addInitScript + */ await page.goto('/sale'); await page.waitForLoadState('networkidle'); }
  // real
  async selectPlace(...) { ... await page.getByTestId(...).click(); await page.waitForURL(/\/sale/); }
  ```

---

## 9. `personas.ts:31` - `mockState` fixture only installs in `mock` mode; tests have no way to know which mode they ran in

- **Severity:** major
- **Location:** `e2e/support/personas.ts:21-28`
- **Problem:** The fixture returns `null` in real mode. Tests that depend
  on direct state manipulation (the foundation does not yet expose
  `mockState`, but real foundations do) have to null-check `mockState!`
  and there is no `test.skip` for mock-only tests. The README at line 69
  says "HTTP error simulations only work in mock mode. These tests are
  skipped automatically in real mode" - but **no automatic skip exists in
  the foundation code**. There is no `test.skip(MODE === 'real', ...)`
  helper, no `mockOnly` test variant, no tag-based filter. The README
  is aspirational and the code does not enforce it.
- **Why it matters:** A future error-path test will silently run in
  real mode, fail with "expected 500, got 200" or similar, and be
  attributed to a real backend bug.
- **Fix:** Provide a `mockOnly` variant or skip helper:
  ```ts
  export const mockOnly = test.extend({});
  mockOnly.skip(MODE !== 'mock', 'mock-only test');
  ```

---

## 10. `api-mock.ts:80-88` - `paginated` ignores filtering query params; tests of filtering/search will pass with full unfiltered datasets

- **Severity:** critical
- **Location:** `e2e/fixtures/api-mock.ts:80-88`,
  handlers throughout `api-mock-handlers.ts` (e.g. line 35-38, 274-277)
- **Problem:** Almost every list endpoint reads only `page`/`pageSize`
  from the URL and ignores any filter (`?search=`, `?placeId=`, `?from=`,
  `?to=`, `?type=`, etc.). The transactions handler at line 274 is the
  worst offender: the real backend filters by date range, place, user,
  cancellation status. The mock returns the entire transaction list,
  paginated. A test that asserts "filter by place 1 shows only place 1
  transactions" would still pass if the filter UI was completely broken
  (because the rendered grid happens to only show ~10 rows due to
  pagination, and most of the seed data happens to be place 1).
- **Why it matters:** Filter and search are exactly the features users
  rely on. A regression where the frontend stops sending the `placeId`
  query param would be invisible because the mock would still return the
  same 10 rows in the same order - and the test would pass.
- **Fix:** Each list handler must respect filter params, or - if filters
  are out of scope - tests must assert that the *frontend* sent the
  correct query string:
  ```ts
  const req = await page.waitForRequest(r => r.url().includes('/transactions?placeId=1'));
  ```

---

## 11. `api-mock-handlers.ts:166` - Trailing-`/` regex bug accepts `POST /places/1/goodsXYZ` and other unintended paths

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock-handlers.ts:166`
- **Problem:** Pattern `^places\/(\d+)\/goods` (no trailing `$`) matches
  `places/1/goods`, `places/1/goods/42`, `places/1/goodsfoo`, anything.
  Compare with line 173 (`places/(\d+)/goods/(\d+)$` - properly anchored).
  The route table is order-dependent: `matchRoute` returns the first
  match. The DELETE on line 173 has method `DELETE`, while line 166 is
  `POST` - so they don't collide on method. But: a future `POST
  places/{id}/goodstypes` would match the line 166 handler instead of
  whatever was intended.
- **Why it matters:** Silent route hijacking. Adding a new endpoint may
  unexpectedly hit an old handler.
- **Fix:** Anchor every regex with `$` (or `\?|$` if the path may have a
  query, but the matching uses pathname only so `$` is enough).

---

## 12. `api-mock-handlers.ts:217-222` - `goodstypes` POST increments `nextId.goods`, not `nextId.goodstypes`

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock-handlers.ts:218`
- **Problem:** `const id = ++state.nextId.goods;` - same counter as
  `goods`. `MockState.nextId` (api-mock.ts:18-26) does not even have a
  `goodstypes` field, so this is "intentional" by omission, but the
  result is that creating a new goods-type increments the goods counter,
  and creating a new goods after that may collide with an earlier
  goods-type id. Since they live in separate arrays, no array collision
  occurs - but any test that asserts on `id` values directly (e.g. "the
  first new goods has id 1001") will be off because the goodstypes test
  consumed id 1001 already.
- **Why it matters:** Subtle ordering-dependent test failures, hard to
  diagnose, breaks test isolation guarantees.
- **Fix:** Add a separate counter `goodstypes: 1000` to `nextId` and use
  it.

---

## 13. `api-mock-handlers.ts:12-32` - Auth handler accepts blocked users on `password` legacy field, returns blocked 403; but `roles` echoed unconditionally include sensitive admin roles for any persona

- **Severity:** minor (correctness), major (test integrity)
- **Location:** `e2e/fixtures/api-mock-handlers.ts:23-31`
- **Problem:** The handler returns `permissions: []` always, ignoring
  what the real backend would compute from roles. Combined with
  `MockAuthAdapter` injecting `ALL_PERMISSIONS` (auth-adapter.ts:50)
  via `addInitScript` for every persona, the `permissions` localStorage
  key is `ALL_PERMISSIONS` for *every* user including `asMember`, which
  means a test of "member sees forbidden 403 on /admin/users" would
  pass instead of failing - the member has all admin permissions in
  the mock. The login-flow test actually goes through the real
  `POST /authentication/user/email` path (which returns `[]`), but
  most tests skip login (use `addInitScript` only), so they get the
  `ALL_PERMISSIONS` injection.
- **Why it matters:** Permission-related tests are silently disabled.
  The whole "different personas see different things" assumption is
  defeated for any test using addInitScript-only auth.
- **Fix:** Inject permissions per-persona based on role, not a blanket
  `ALL_PERMISSIONS`:
  ```ts
  const ROLE_PERMS: Record<EUserRole, string[]> = {...};
  permissions: JSON.stringify(user.roles.flatMap(r => ROLE_PERMS[r]))
  ```

---

## 14. `auth-adapter.ts:53-58` - `addInitScript` injection runs on *every* page navigation; localStorage is rewritten constantly

- **Severity:** minor
- **Location:** `e2e/fixtures/auth-adapter.ts:53-58,88-93`
- **Problem:** `addInitScript` registers a script that runs on every new
  document. If the app logs out (clears `apiToken`), the next navigation
  re-injects it. A test that asserts "logout actually clears the token
  and bounces to login" will fail because the next navigation immediately
  re-populates localStorage, and the user appears logged in again. The
  app's `logout()` calls `localStorage.removeItem('apiToken')` (auth.service.ts:108),
  but after `router.navigate(['/login'])`, the new page load triggers
  the init script *again*, restoring the token.
- **Why it matters:** Logout tests cannot work on this foundation.
- **Fix:** Use `page.evaluate` to set localStorage *once* before the
  first navigation, or clear `addInitScript` before logout-related
  steps. Document the limitation clearly.

---

## 15. `personas.ts:23` - `installApiMock` is awaited inside the `mockState` fixture, but `page.route` registration is racing the `loginAs` `addInitScript`

- **Severity:** major
- **Location:** `e2e/support/personas.ts:21-28,30-35`
- **Problem:** Fixture dependencies in Playwright run sequentially within
  a test, so `mockState` resolves before `asAdmin` runs `loginAs`. Good.
  But `installApiMock` calls `page.addInitScript` for `navigator.bluetooth`
  (line 93-104) AND `page.route('**/api/v1.1/**', ...)`. The route handler
  is registered, then the persona's `loginAs` adds another init script,
  then the test calls `page.goto('/')`. If the persona did `page.goto`
  *inside* the persona fixture (it doesn't - it just adds init scripts and
  hands the page back), the bluetooth shim might not yet be active. Right
  now the order works by accident; any refactor that moves a `page.goto`
  earlier in a persona will break the bluetooth crash workaround.
- **Why it matters:** The "headless Chromium has no Web Bluetooth" bug
  is described as critical (`api-mock.ts:92` comment). The fix is fragile
  and depends on no test/persona ever navigating before the persona
  finishes setup.
- **Fix:** Move the bluetooth shim into the `mockState` fixture explicitly
  *or* into an autouse fixture so it always runs first regardless of
  composition order.

---

## 16. `api-mock-handlers.ts:289-306` - `transactions/payment` mock does not validate funds, ignores overdraft limit

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock-handlers.ts:289-306`
- **Problem:** The mock subtracts the total from `acc.currentAmount`
  unconditionally. The real backend rejects transactions that exceed
  `overdraftLimit`. A test that asserts "submit blocked when over-limit"
  would pass if the frontend doesn't even pre-check (because the mock
  would also accept), and a test that asserts "submit succeeds when
  within limit" would also pass even if the backend would have rejected
  in production.
- **Why it matters:** Overdraft handling is a money-handling correctness
  feature. Tests cannot detect regressions where the frontend silently
  posts unchecked, because the mock matches the broken frontend's
  behaviour.
- **Fix:** Check `currentAmount + overdraftLimit >= total` and return
  `{ status: 400, body: { error: 'overdraft' } }` on failure.

---

## 17. `card-loader.component.spec.ts:115-118` - "all users, not just first 3" assertion only checks length, not content or order

- **Severity:** major
- **Location:** `src/app/common/components/card-loader/card-loader.component.spec.ts:115-118`
- **Problem:** The test name promises that the dropdown shows *all* user
  cards (not just the first 3 like the legacy buttons). The assertion is
  `expect(allUserCards.length).toBe(mockCards.length)` - only the length.
  This passes even if the implementation: (a) returns 4 random cards, (b)
  duplicates one card 4 times, (c) returns the first 4 cards always
  ignoring the user filter. The intent of the test ("not just first 3")
  is not encoded.
- **Why it matters:** Regression in the slicing logic that swapped
  `cards.filter(...)` for `cards.slice(0, 3)` would not be caught - the
  array length might happen to be 3 or 4 from coincidence.
- **Fix:** Assert content:
  ```ts
  expect(allUserCards.map(x => x.uid).sort()).toEqual([1001, 1002, 1003, 1004].sort());
  expect(allUserCards.map(x => x.name)).toEqual(['Alice', 'Alice', 'Bob', 'Carol']);
  ```
  Note also that the spec name says "an entry for each card" but Alice
  has two cards (1001, 1004) - the assertion `length === mockCards.length`
  works only because of this coincidence; if a future code change
  deduped by user, the test would fail with no useful diagnostic.

---

## 18. `card-loader.component.spec.ts:108-113` - `selectDebugUser(0)` short-circuits on `null` only, but `0` is a valid uid that would still emit; uncovered branch

- **Severity:** minor
- **Location:** `src/app/common/components/card-loader/card-loader.component.ts:112-116`,
  `card-loader.component.spec.ts:108-113`
- **Problem:** Implementation: `if (uid != null) { this.cardIdChange.emit(uid); }`.
  `uid != null` is true for `0`. The mat-select default empty value emits
  `null` (handled), but if a developer ever sets a placeholder `<mat-option [value]="0">`
  for "no selection", `0` would emit and trigger a card scan with uid 0.
  The test only covers the happy path (1001) - it never tests the negative
  branch, never tests `null`, never tests `undefined`. The whole guard is
  untested.
- **Why it matters:** Anyone deleting `if (uid != null)` would not see a
  test failure. The test does not constrain the implementation.
- **Fix:** Add `expect(emittedUid).toBeUndefined()` after a
  `selectDebugUser(null as any)` invocation. Add a test for `selectDebugUser(0)`
  with the documented expected behaviour.

---

## 19. `card-loader.component.spec.ts:94-101` - Double `whenStable()` is a code smell; indicates the test is fighting an unsettled async pipeline

- **Severity:** minor
- **Location:** `src/app/common/components/card-loader/card-loader.component.spec.ts:97-100`
- **Problem:**
  ```ts
  fixture.detectChanges();
  await fixture.whenStable();
  await fixture.whenStable();
  fixture.detectChanges();
  ```
  Calling `whenStable` twice is a hack, almost always meaning "the first
  whenStable resolved before the chained promise inside ngOnInit settled."
  The proper fix is to await the actual promise(s) returned by `ngOnInit`.
  This pattern will silently start failing when Angular's scheduler
  changes (zoneless mode) - and now there will be no signal at all that
  the test is racing.
- **Why it matters:** Foundation tests with hidden timing assumptions
  rot fast.
- **Fix:** Either expose a public method on the component to wait for
  ready state (e.g. a `ready$: BehaviorSubject<boolean>`) or trigger
  ngOnInit via `await component.ngOnInit()` directly in the test.

---

## 20. `playwright.config.ts:11-12` - 30s test timeout + 5s expect timeout + 10s action timeout = silent flakes under load

- **Severity:** minor
- **Location:** `e2e/playwright.config.ts:11-19`
- **Problem:** With `actionTimeout: 10_000` and `expect.timeout: 5_000`,
  a single `getByTestId(...).click()` followed by an `expect(...).toBeVisible()`
  consumes up to 15s of a 30s test budget. Two such pairs and the test
  hits the global timeout - which manifests as a generic "test exceeded
  30000ms" error, not a precise locator failure. Useful diagnostics are
  lost. Combined with `retries: 2` on CI, a flaky locator gets three
  bites at the apple, hiding intermittent regressions.
- **Why it matters:** Hard to debug, encourages "just retry it" culture.
- **Fix:** Either lower `expect.timeout` to 2_000 (force tests to wait
  on explicit signals like `waitForResponse`) or raise total timeout to
  60s. Drop CI retries to 1; investigate flakes instead of masking them.

---

## 21. `api-mock-handlers.ts:283-306` - Payment handler decrements account but does not update card history, transaction listing returns wrong data

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock-handlers.ts:283-306`
- **Problem:** `state.transactions.unshift(tx)` adds to the global
  transactions list, but `userName` and `placeName` are empty strings
  (line 301-302). Any test that asserts the new transaction shows the
  user/place name in the transaction grid will fail with empty strings -
  but the test won't tell you *why* (it'll just say "expected 'Marie
  Členka' but got ''"). The fixture-derived transactions do populate
  the names (via `userName(s.userId)` in `transactions.ts:65`), but
  newly-created ones do not. Inconsistent shape between seed data and
  freshly-minted data leads to flaky tests depending on whether the
  test creates a new tx or relies on a seeded one.
- **Why it matters:** Tests that cover the full create-then-list flow
  will see different shapes than tests that only list seeded data.
- **Fix:** Resolve names from state when creating the tx:
  ```ts
  const u = state.users.find(x => x.id === body?.userId);
  const p = state.places.find(x => x.id === body?.placeId);
  ... userName: u?.name ?? '', placeName: p?.name ?? '' ...
  ```

---

## 22. `pos.ts:8` - `getByRole('option', { name: userName })` matches by accessible name; multiple users with same name silently match the wrong one

- **Severity:** minor
- **Location:** `e2e/support/pos.ts:8`
- **Problem:** Fixtures could (and likely will) end up with duplicate
  display names ("Jan Novák" is common). Currently fixtures all have
  unique names by coincidence. `getByRole('option', { name: 'Jan' })`
  with multiple Jan options would throw "strict mode violation," but
  the helper would surface this as a generic timeout/visibility error,
  not "ambiguous selector." Worse, if the option's accessible name
  includes more than just the user name (e.g. "Jan Novák (1001)"), the
  match could silently pick the first partial match.
- **Why it matters:** Brittle locator strategy. The test "scan Marie's
  card" should be looking up by `uid`, not by display name.
- **Fix:** Locate by the option's `value` attribute or by a
  `data-testid`. Add a `data-testid="card-loader-debug-user-option-{uid}"`
  to each `<mat-option>`.

---

## 23. `cleanup.ts:21` - `page.request.get` uses `page` cookies/storage but bypasses init scripts that the *next* test relies on

- **Severity:** minor
- **Location:** `e2e/support/cleanup.ts:21,28`
- **Problem:** `page.request` shares storage state with `page`. Cleanup
  calls succeed only if the `apiToken` is still in localStorage (and as
  per Finding 6, it reads the wrong key anyway). After cleanup, the test
  finishes. The next test uses a fresh page (Playwright default) - fine.
  But: cleanup uses `page.request.delete` against `/api/v1.1/{ep}/{id}`
  - paginated endpoints in real-mode return more than 50 items per page,
  and cleanup only fetches page 1 (no `?pageSize=` query). Long-running
  test suites accumulate `e2e-` entities on pages 2+ that are never
  cleaned. Eventually the `e2e-` prefix appears on page 1 less and less
  as the seed data dominates.
- **Why it matters:** Slow, silent leak of test data over time.
- **Fix:** Iterate pages until empty: `?page=N&pageSize=200` in a loop.

---

## 24. `auth-adapter.ts:78` - Real-mode token discovery is `json.token ?? json.accessToken ?? json.jwt` - swallows unknown shape, never warns

- **Severity:** minor
- **Location:** `e2e/fixtures/auth-adapter.ts:78`
- **Problem:** Three fallbacks for the token field name. If the backend
  changes to `bearerToken`, the code throws "real login response missing
  token" - good, that part works. But the silent fallback chain means
  there is no signal if the backend response shape changes between
  versions. Tests in real mode could be silently using a stale token
  field for months.
- **Why it matters:** Robustness via fallbacks usually masks bugs. The
  E2E suite is the *one place* you want to learn about contract drift
  early.
- **Fix:** Pick one canonical field (`token`) and throw on anything
  else, with a clear error pointing to the response body.

---

## 25. `smoke.spec.ts:13-16` - Asserting only one user row is visible; does not prove the list rendered correctly

- **Severity:** minor
- **Location:** `e2e/tests/smoke.spec.ts:15`
- **Problem:** The test asserts that `row-user-{memberUser.id}` is
  visible. Given the fixtures define 10 users with member roles,
  pagination defaults to 50, so all 10 appear on page 1. The assertion
  passes if any one row renders. A regression where the list renders
  the row but with empty content (broken column binding) would still
  pass. A regression where only the row for `memberUser.id` happens to
  render and all others are missing would also pass.
- **Why it matters:** This is a smoke test for the *list*, but it
  asserts nothing about the list as a whole.
- **Fix:**
  ```ts
  const rows = asAdmin.locator('[data-testid^="row-user-"]');
  await expect(rows).toHaveCount(10);
  await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id)))
    .toContainText('Marie Členka');
  ```

---

## 26. `card-loader.component.spec.ts:103-106` - Asserts dropdown element exists, not that it is functional

- **Severity:** minor
- **Location:** `src/app/common/components/card-loader/card-loader.component.spec.ts:103-106`
- **Problem:** `expect(dropdown).toBeTruthy()` only proves the
  `[data-testid]` attribute is present in the DOM. The `<mat-select>`
  could be `disabled`, `hidden`, missing all options, throwing on click
  - the test would still pass.
- **Why it matters:** This is the only test asserting the dropdown is
  "rendered." If the rendering breaks but the testid is preserved, no
  test catches it.
- **Fix:**
  ```ts
  expect(dropdown).toBeTruthy();
  expect(dropdown.nativeElement.getAttribute('aria-disabled')).not.toBe('true');
  // Verify options are present
  dropdown.nativeElement.click();
  await fixture.whenStable();
  const options = document.querySelectorAll('mat-option');
  expect(options.length).toBe(mockCards.length);
  ```

---

## 27. `playwright.config.ts:30` - `reuseExistingServer: !process.env['CI']` causes local mock-mode tests to silently use a real backend if `ng serve` was started without proxy disabled

- **Severity:** minor
- **Location:** `e2e/playwright.config.ts:30`
- **Problem:** Locally, if the dev already has `ng serve` running with
  the default proxy config (which forwards `/api/**` to a real backend),
  Playwright reuses that server. The `installApiMock` does
  `page.route('**/api/v1.1/**', ...)` which intercepts at the browser
  level, *before* the proxy is consulted - so this works in mock mode.
  But there is no test verifying the mock layer is actually
  intercepting; if `page.route` ever fails to register or unregisters
  early, the test silently falls through to the real backend, and any
  data-shape mismatch between mocks and the real API would produce
  cryptic failures.
- **Why it matters:** Mock-mode tests should *prove* they are running
  in mock mode, and fail loudly if a real backend is reached.
- **Fix:** In `installApiMock`, register a catch-all that asserts no
  unmocked requests escape:
  ```ts
  await page.route('**/api/**', route => {
    if (!matchedRoute) throw new Error(`unmocked: ${route.request().url()}`);
  });
  ```
  Or, in mock mode, set `baseURL` to a port with no real backend.

---

## 28. `personas.ts:7` - Side-effect import comment claims circular-init avoidance, but the cure is worse than the disease

- **Severity:** minor
- **Location:** `e2e/support/personas.ts:4-7`
- **Problem:** The import `import '../fixtures/api-mock-handlers';` is a
  side-effect import that registers all handlers into the module-level
  `routes` array (api-mock.ts:65). The comment justifies this as
  avoiding a circular init. The result is that `routes` is populated
  exactly once per worker, and there is no way to swap, replace, or
  reset handlers between tests. Combined with the warning in finding 5,
  this design choice makes per-test override impossible without
  reimporting modules - a contortion most testers will not attempt.
- **Why it matters:** The architecture forecloses the most common
  E2E mock-layer feature (per-test override).
- **Fix:** Replace the side-effect import with an explicit factory:
  ```ts
  // api-mock-handlers.ts
  export function registerHandlers(on: typeof onFn) { on('POST', ..., ...); }
  // installApiMock
  installApiMock(page, opts) {
    const localRoutes: Route[] = [];
    registerHandlers((m, p, h) => localRoutes.push({m, p, h}));
    if (opts?.overrides) opts.overrides.forEach(o => localRoutes.unshift(o));
    ...
  }
  ```

---

## Summary of severity counts

- **Critical:** 6 (#1, #2, #4, #5, #6, #10)
- **Major:** 12 (#3, #7, #8, #9, #11, #12, #13, #15, #16, #17, #21, #28)
- **Minor:** 10 (#14, #18, #19, #20, #22, #23, #24, #25, #26, #27)

**Total findings:** 28

Recommended action: Block merge until findings 1-6 are resolved. Findings
7-13 should be addressed before any meaningful test count is built on the
foundation. Findings 14-28 are tech-debt that will catch up within a
quarter if ignored.
