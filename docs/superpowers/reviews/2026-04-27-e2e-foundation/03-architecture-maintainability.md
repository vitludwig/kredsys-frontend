# E2E Foundation — Architecture & Maintainability Review

**Reviewer:** Senior Test Developer #3 (test architecture / maintainability / scalability)
**Branch:** `redesign`
**Scope:** `e2e/**`, `src/app/common/components/card-loader/*` (modified as fixture)
**Date:** 2026-04-27

## Executive Summary

The foundation looks superficially clean, but it is a paper bridge for the 80-test suite that is supposed to roll across it for the next two years. The router/handler split has a hidden side-effect import that *only works because* `personas.ts` happens to import it; `routes` is a module-singleton that will accumulate registrations across worker reuse and across test files; the persona fixtures share a single `page` and use a `void mockState` hack that breaks the moment anyone composes two personas in one test; the entire mock handler layer is typed `body: any` / `tx: any` and re-implements pagination + filtering inline instead of reusing the private `paginated` helper consistently; selectors and `data-testid` strings are duplicated as raw literals in templates with zero compile-time link; fixture id space is hand-numbered and already collides with `nextId.goods` (goods *and* goodsTypes share the same `nextId.goods` counter); messages are flat constants with no templating story for plurals or interpolation; the `e2e/tsconfig.json` `rootDir: ".."` pulls **all** of `src/` into the e2e program; cleanup is silent best-effort; the smoke test asserts `/sale|/place-select` which hides the real outcome; POS helpers are too primitive to compose; and `card-loader` exposes E2E hooks via a `data-testid` whose key (`'card-loader-debug-user-select'`) is a string duplicated between TS, HTML and `selectors.ts`. Below: 18 findings, severity-tagged.

---

## 1. Side-effect handler registration coupled to `personas.ts` import order

- **Severity:** critical
- **Location:** `e2e/support/personas.ts:7`, `e2e/fixtures/api-mock.ts:65`, `e2e/fixtures/api-mock-handlers.ts:1`
- **Problem:** `api-mock-handlers.ts` registers ~60 `on(...)` calls into a module-level `routes: RouteEntry[]` array as a top-level side effect. Whether any handlers exist at all depends on someone importing `'../fixtures/api-mock-handlers'` for its side effect. Today that import lives in `personas.ts` with a stern comment about avoiding a "circular initialization." Any test, helper, or future contributor who bypasses `personas` and calls `installApiMock(page)` directly will get a router with **zero** routes and a flood of `[mock] unhandled` warnings — followed by 404s that look like product bugs.
- **Why it matters:** At 50+ tests, contributors will copy-paste `installApiMock` into ad-hoc setup (e.g., a non-persona test, a fixture composition test, a Storybook-like harness). The failure mode is silent (404 + console warn), not a type error. New devs will spend hours chasing it.
- **Fix:** Have `api-mock.ts` `import './api-mock-handlers'` itself, *or* invert the dependency — export a `registerHandlers(register: (m,p,h)=>void)` function from `api-mock-handlers.ts` and have `installApiMock` call it explicitly. Kill the module-level `routes` singleton; build the table inside `installApiMock` and capture per-page. Either way, registration must be unconditional and self-contained, not contingent on import order.

## 2. Module-level `routes` array is shared across all pages and test files

- **Severity:** critical
- **Location:** `e2e/fixtures/api-mock.ts:65,67-69,90`
- **Problem:** `routes` is module-scoped. `installApiMock` reads from it. With Playwright's `fullyParallel: true` and worker reuse, a single worker process may run dozens of test files. If a test (or future test helper) ever calls `on(...)` from inside a test (e.g. to register a per-test override — which is exactly what people will want for "simulate 500 on this endpoint"), those registrations leak into every subsequent test in that worker. There is also no `off()` and no way to clone or scope the table. The `tests/smoke.spec.ts:1` import chain registers everything once *for the worker*, so the first test wins forever.
- **Why it matters:** The first time someone writes `on('GET', /^users$/, () => ({ status: 500, body: {} }))` inside a `test()` to simulate an error, every following test in that worker silently breaks, and the breakage is non-deterministic across worker counts. This is the single most likely source of flake at 50+ tests.
- **Fix:** Make the route table per-`installApiMock` call. Builder pattern: `createMockRouter()` returns `{ on, install }`, where `install(page, state)` closes over the local table. Personas instantiate one router per `page`. For per-test overrides, expose `mockState`-style fixture that returns the router so tests can `router.on(...)` and have it cleaned up by `use()` teardown.

## 3. Personas use a `void mockState` hack that won't survive composition

- **Severity:** major
- **Location:** `e2e/support/personas.ts:30-57`
- **Problem:** Every persona body starts with `void mockState;` — a magical incantation whose only purpose is to force Playwright's fixture dependency graph to instantiate `mockState` before login. This is fragile: (a) if a tooling refactor changes how unused destructured fixtures are tracked, the hack silently breaks; (b) it is undocumented in the personas file (the comment lives only in the side-effect import); (c) it does not compose — there is no `asAdminAndWorker` and no obvious pattern for "this test needs both personas." Asking for two personas in one test creates two `loginAs` calls against one `page`, which clobber each other's `localStorage` — but TypeScript will allow it.
- **Why it matters:** The first test that needs to switch users mid-test (e.g., admin creates user, member logs in, verifies) will reach for two personas, get silent breakage, and write a workaround. The patterns scale poorly.
- **Fix:** Replace the `void mockState` with an explicit `await mockState; // ensure router installed before login`, or better: make `mockState` a worker-scoped fixture that personas list as a dependency in the typed signature without the hack. For multi-user flows, expose a `loginAs(page, user)` *helper* that tests call directly, and reserve persona fixtures for the "default user for this whole test" case. Document this in the personas file.

## 4. `mockState: MockState | null` leaks `null` into every consumer

- **Severity:** major
- **Location:** `e2e/support/personas.ts:13,21-28`, `e2e/fixtures/api-mock.ts:7-43`
- **Problem:** Tests that want to inspect / mutate the mock state (e.g. "after submitting payment, assert the in-memory transactions array grew") must either `if (mockState) { ... }` everywhere or non-null-assert `mockState!`. The fixture nullability is a leaky encoding of "are we in mock mode?" — a question that should be answered by *not exposing* `mockState` in real mode at all, or by giving real mode a stub state object.
- **Why it matters:** Every assertion that touches the mock state will be polluted with `!` or `if`. People will copy-paste, and the moment someone writes `mockState!.users.push(...)` in real mode by accident, they'll get a runtime null deref under `--project=real` with an unhelpful stack.
- **Fix:** Either (a) split into two persona modules (`personas.mock.ts` exposes `mockState`, `personas.real.ts` does not, or use a discriminated union per `MODE`), or (b) make `mockState` a real-mode stub that throws synchronously with a clear "this fixture is not available in real mode" message on access. Don't let `null` propagate.

## 5. `body: any` / `tx: any` / `Record<string, any>` — the type system is off

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:46,52,117`; `e2e/fixtures/api-mock-handlers.ts:286,291,312,333`
- **Problem:** `HandlerContext.body: any`, `HandlerResult.body: any`, every transaction handler builds a `tx: any`, `body?.items.reduce((s: number, i: any) => ...)`. Handler authors get zero help: no autocompletion on request body, no compile error if they typo `body.userIid`, no exhaustiveness on response shape. The `route.fulfill` body is just `JSON.stringify(result.body)` — there is nothing keeping handler responses in sync with the real API contract.
- **Why it matters:** At 50+ tests, any drift between the backend `IUser`/`ITransaction` and the mock will manifest as "mock returns wrong shape, test passes anyway, real-mode fails opaquely." The whole point of having `MODE === 'real'` is invalidated if the mock can't be type-checked against the same interfaces the app consumes.
- **Fix:** Define `interface PaymentRequest { userId: number; placeId: number; items: PaymentItem[] }` etc. (mirror the service-layer DTOs in `src/`). Make `Handler<TBody, TResp>` generic in the request and response. The `on()` helper takes those generics. Yes, it's more typing — that is the entire point of TypeScript.

## 6. `selectors.ts` ↔ `data-testid` strings have zero compile-time link

- **Severity:** major
- **Location:** `e2e/support/selectors.ts:*` vs `card-loader.component.html:17,44` and every other template
- **Problem:** `SEL.cardLoader.userSelect = 'card-loader-debug-user-select'` is a hand-typed string in `selectors.ts`. The template literal `data-testid="card-loader-debug-user-select"` is a *separate* hand-typed string with no link. Rename one, the other silently rots. Multiply by ~60 selectors x ~60 templates and you have a permanent maintenance tax that nobody will notice until tests start matching nothing and waiting 30s timeouts.
- **Why it matters:** A test file at month 12 will tell you "selector not found" but the template *just* renamed the testid in a refactor that passed all unit tests because unit tests don't exercise testids. You will spend a day per refactor reconciling.
- **Fix:** Either (a) generate `selectors.ts` from a script that scans templates (or the reverse — generate template `data-testid` via an Angular directive `[testId]="SEL.cardLoader.userSelect"` that consumes the constants), or (b) ship a unit/CI guard test that walks `selectors.ts` and asserts every value occurs in at least one template file. Option (a) is the right long-term play; option (b) is a one-evening hack.

## 7. Magic id literals everywhere; no fixture builders/factories

- **Severity:** major
- **Location:** `e2e/fixtures/data/users.ts:6-25`, `goods.ts:3-15`, `transactions.ts:22-53`, `cards.ts:7-15`, etc.
- **Problem:** Every fixture row is hand-numbered (`id: 1..30`). Cross-references are also hand-typed (`userId: 4` in transactions and cards). There is no `makeUser({ name })` factory, no `nextId()` helper at *generation* time, no relation helper like `linkUserToGroup(user, group)`. The `nextId.goods` counter in `MockState` (api-mock.ts:41) is *shared between goods and goodsTypes* — `POST /goodstypes` increments `state.nextId.goods` (handlers:218) — so creating a goodsType pushes the goods id sequence forward and vice versa. That is a latent collision waiting for the first test that creates both.
- **Why it matters:** Adding a single user means renumbering nothing today, but the moment you insert a new user "in the middle" of the table for readability you break every transaction `userId` reference. With 50 tests, fixture authoring becomes a bottleneck — every contributor reinvents factories on the side.
- **Fix:** Introduce a `factory.ts`: `const userFactory = createFactory(seed => ({ id: seed.next('user'), name: '...', ... }))` with a deterministic counter per type. Compose: `const marie = userFactory.build({ name: 'Marie Členka' }); const card = cardFactory.build({ userId: marie.id })`. Fix the `nextId.goods` / `nextId.goodsType` collision *now* — it is an unambiguous bug.

## 8. `MODE === 'real'` branching scattered across 4+ files

- **Severity:** major
- **Location:** `e2e/fixtures/auth-adapter.ts:6,102`; `e2e/support/personas.ts:22,34,42,50`; `e2e/support/cleanup.ts:11`; (implicitly the smoke test's `/sale|/place-select`)
- **Problem:** Mode-awareness is leaking into personas, cleanup, and the auth adapter. Every new helper that does anything different in real vs mock will reach for the same env-var check. There is no central `Mode` interface that says "here is what mock does, here is what real does, pick one at startup." Today personas have `if (MODE === 'real') await cleanupE2eEntities(page)` inside the persona body — meaning cleanup is glued to login flows rather than being its own afterEach.
- **Why it matters:** Adding a third mode (e.g., "record-then-replay" or "staging") requires touching every file that checks `MODE`. Forgotten branches manifest as silent skips or wrong-mode behavior.
- **Fix:** Define `interface Mode { auth: AuthAdapter; state: MockState | null; cleanup(page: Page): Promise<void>; supports(feature: 'http-error-injection' | ...): boolean }`. Pick once at startup. Personas call `mode.cleanup(page)`; tests call `mode.supports('http-error-injection') ? test(...) : test.skip(...)`. Eliminates raw `MODE === 'real'` from every consumer.

## 9. POS helpers don't compose — every test will reinvent

- **Severity:** major
- **Location:** `e2e/support/pos.ts:21-27`
- **Problem:** `addToBasket(page, id)` clicks one tile. `submitOrder(page)` clicks submit. There is no `addToBasketMultiple(page, [{id, qty}])`, no `submitOrderAndExpectSuccess(page)`, no `submitOrderAndExpectOverdraft(page)`, no `clearBasket(page)`, no `expectBasketTotal(page, n)`. Tests will write 10-line flows; ten tests in, three different ways of "submit and assert success" will exist.
- **Why it matters:** POS is the highest-traffic surface for this app. Without composable helpers, 30 sale tests will be 30 unique snowflakes — exactly what the suite is supposed to avoid.
- **Fix:** Build out the POS DSL now: `expectTotal(page, kc)`, `expectBasketContains(page, goodsId, qty)`, `expectOverdraftWarning(page)`, `expectAlertSuccess(page, msg)`, `removeFromBasket(page, id)`, `clearBasket(page)`. Treat `pos.ts` as an actual page-object module, not a thin wrapper. Same critique applies to admin (`createUser`, `editUser`, `deleteUser`) — none of those exist yet and they will be needed *immediately*.

## 10. No abstracted retry / waitFor patterns — tests will reinvent timeouts

- **Severity:** major
- **Location:** `e2e/support/*` (absence)
- **Problem:** There is no `waitForApiCall(page, /\/transactions\/payment$/)`, no `waitForToast(page, kind, text)`, no `waitForGridRefresh(page)`. Playwright's auto-waiting is good for clicks, but business-flow waits (e.g., "wait for the transaction list to refetch after a payment") will be done with `page.waitForTimeout(500)` ad hoc — that's how flake gets in.
- **Why it matters:** A flaky test in CI is worse than a missing test — it erodes trust in the suite. At 80 tests, even a 1% flake rate per test is a 55% per-run flake.
- **Fix:** Ship `support/wait.ts` with `waitForApi(page, method, urlPattern, opts?)`, `waitForAlert(page, kind, message?)`, `waitForUrl(page, pattern)` *before* writing the next test, not after the first flake.

## 11. `paginated()` is exported but handlers re-implement filter+paginate inline

- **Severity:** minor
- **Location:** `e2e/fixtures/api-mock.ts:80-88,135`; `e2e/fixtures/api-mock-handlers.ts:71-88,98-101,116-141,...`
- **Problem:** Almost every list handler is the same shape: `const list = state.X.filter(predicate); const { page, pageSize } = pageParams(url); return { body: paginated(list, page, pageSize) };`. There is no `paginatedListHandler(state, predicate)` helper. Sort, filter-by-query-param, and free-text search are all not implemented — the moment a UI feature uses `?search=foo`, every handler grows a one-off branch.
- **Why it matters:** Mock drift. The real backend supports pagination + sort + filter; the mock supports pagination only. Tests will pass against the mock and fail against real, or worse, hide real product bugs.
- **Fix:** `function listHandler<T>(getList: (s: MockState) => T[], opts?: { filter?: (item: T, params: URLSearchParams) => boolean; sort?: ... })`. Most handlers become one line.

## 12. The smoke test's `/\/sale|\/place-select/` disjunction hides behavior

- **Severity:** major
- **Location:** `e2e/tests/smoke.spec.ts:10`
- **Problem:** `await expect(asAdmin).toHaveURL(/\/sale|\/place-select/);` accepts either outcome and is justified in the comment ("admin has no preselected place, so the SALE redirect bounces to /place-select"). But "the SALE redirect bounces" is the *test condition*. If the redirect logic regresses to land on `/sale` directly with an empty placeId, this assertion still passes. Disjunction in URL assertions is a code smell — every disjunction is one branch you stopped testing.
- **Why it matters:** Smoke tests are the canary. A green canary that asserts "either A or B" is a canary that lies.
- **Fix:** Decide what *should* happen. If admin must land on `/place-select`, assert that. If admin lands on `/sale` and then redirects, assert the final URL after the redirect (with `waitForURL`). Either way, single URL.

## 13. `selectDebugUser` has no null/clear path; spec only covers happy path

- **Severity:** minor
- **Location:** `src/app/common/components/card-loader/card-loader.component.ts:112-116`, `card-loader.component.spec.ts:108-113`
- **Problem:** `selectDebugUser(uid: number): void { if (uid != null) this.cardIdChange.emit(uid); }` — TS says `uid` is a `number`, but `MatSelect.selectionChange.value` can be `undefined` if the select is cleared programmatically. The spec only tests the truthy path. There is no test for `selectDebugUser(null as any)`, no test for double-emit when the user re-selects the same option (which on `mat-select` *does* fire `selectionChange`), and no test for what happens if `allUserCards` is empty.
- **Why it matters:** Tests that scan the same user twice in a row will get an unexpected double `cardIdChange` and trigger duplicate downstream side effects (logout flow, etc.). E2E will catch this as flake; nobody will know why.
- **Fix:** Tighten the type (`uid: number | null | undefined`), add explicit null/undefined branch tests, and consider a `distinctUntilChanged` on the emit. The component is now de-facto E2E API surface — version it like one.

## 14. `e2e/tsconfig.json` `rootDir: ".."` pulls all of `src/` into the e2e program

- **Severity:** major
- **Location:** `e2e/tsconfig.json:14`
- **Problem:** `rootDir: ".."` plus `extends: "../tsconfig.json"` plus `include: ["**/*.ts"]` (relative to `e2e/`) means TS will resolve cross-imports into `src/` — which is exactly what the fixtures already do (`../../src/app/common/types/IUser` etc.). Side effect: an e2e dev can `import { SomeService } from '../../src/app/...'` and accidentally start exercising real Angular DI in a Playwright spec, *and* TS will compile it. Type-checking the e2e program will also walk all of `src/` — slow on a large app and noisy with unrelated errors.
- **Why it matters:** Boundary erosion. The e2e suite is supposed to test the app from the outside. Once `src/` is importable for "just types", someone will import a service "just to reuse a constant" and now the test depends on the app's DI graph.
- **Fix:** Narrow allowed cross-imports. Either (a) limit `include` to `e2e/**/*.ts` and use *type-only* imports for the few `IUser`/`IPlace` etc. you actually need, optionally via a path alias `@kredsys/types/*` that points to a curated barrel; or (b) add a lint rule `no-restricted-imports` banning `../../src/app/**` except in fixture files. The current setup invites abuse.

## 15. `cleanupE2eEntities` is silent best-effort and runs inside personas

- **Severity:** major
- **Location:** `e2e/support/cleanup.ts:31-33`, `e2e/support/personas.ts:34,42,50`
- **Problem:** Every error in cleanup is swallowed by a bare `catch {}` comment "best-effort". If the backend rejects a delete because of FK constraints, you'll silently leave `e2e-foo` rows in the DB; the next run *might* see them and fail mysteriously. Cleanup is also wired into each persona body rather than being an `afterEach` — so any persona that throws *before* `use()` skips cleanup, but an ad-hoc test that doesn't use a persona gets no cleanup at all (`asMember` already has none — see line 53-57).
- **Why it matters:** A 2-year-old DB will accumulate `e2e-` cruft from cancelled runs, FK-blocked deletes, and tests that didn't use the right persona. Eventually somebody truncates by hand and loses real data.
- **Fix:** Move cleanup to a top-level `test.afterEach(async ({ page }, testInfo) => { ... })` registered once in `personas.ts` so every test gets it. Stop swallowing errors silently — `console.warn` with the failed endpoint+id at minimum, attach to `testInfo` so it shows in the HTML report. Better: detect FK failures and retry with a topo-sorted delete order (groups → user_groups → users etc.).

## 16. `messages.ts` is flat constants — no plural/template/interpolation story

- **Severity:** minor
- **Location:** `e2e/support/messages.ts:1-22`
- **Problem:** Every message is a literal string. The Czech app *will* have plurals ("1 položka" / "2 položky" / "5 položek") and interpolation ("Smazáno %{count} položek"). When tests need to match those, the choices are: hand-write a regex per call site, or add a helper per shape. There is also no link to actual i18n files — these constants will drift from the strings the app renders.
- **Why it matters:** First test that asserts a count-bearing toast will copy-paste a regex. Tenth test will copy a slightly different regex. Nobody owns the i18n contract.
- **Fix:** Either (a) load messages from the actual i18n source (xliff/JSON the app ships) and provide a `t(key, params)` helper with plural rules, or (b) accept the flat-constants approach but add a `plural(n, forms: [string,string,string])` helper and a contract test that asserts every `MSG.*` value still appears in the i18n file. Decide before test count grows.

## 17. `messages.ts` is missing 90% of what a Czech UI suite needs

- **Severity:** minor
- **Location:** `e2e/support/messages.ts` (absence)
- **Problem:** The file currently has 4 buttons, 4 alerts, 1 validation message, 1 cardLoader header. The app shows dozens of messages — "Pro načítání karet klikni do aplikace" (the blur overlay), "Nepodařilo se načíst kartu", "Simulovat novou kartu", "Karty uživatelů", "Vyber uživatele (E2E)", every form label, every confirm dialog. Tests will reach for raw Czech literals because `MSG` doesn't have what they need. Once that pattern starts, `MSG` is dead.
- **Why it matters:** Inconsistent: half the suite uses `MSG.buttons.save`, half uses `'Uložit'`. Renaming a label means grepping for *both*.
- **Fix:** Either own it (extract messages from templates wholesale, programmatically) or scope it (delete `MSG` and accept raw strings, but add a lint rule that flags new raw Czech strings in tests). The middle ground we have now is the worst option.

## 18. `data-testid` literal duplicated in template + selectors + spec

- **Severity:** minor
- **Location:** `card-loader.component.html:17,44` (raw strings) vs `e2e/support/selectors.ts:27-28` vs `card-loader.component.spec.ts:104` (raw string `'card-loader-debug-user-select'`)
- **Problem:** The string `'card-loader-debug-user-select'` exists three places: the HTML attribute, `SEL.cardLoader.userSelect`, and a unit-test query selector. The unit test query is a literal, so renaming `SEL.cardLoader.userSelect` won't break the unit test, and renaming the template attribute won't break either the unit test or the selector — only the e2e test.
- **Why it matters:** Three sources of truth = three places to update = at least one place will be missed in every refactor.
- **Fix:** Export the testid constants from a shared location consumable by both the template (via an Angular service or directive) and tests. At minimum, have the unit test import `SEL` from `e2e/support/selectors` and use `By.css('[data-testid="' + SEL.cardLoader.userSelect + '"]')` so spec + e2e share one constant. Better: testid constants live next to the component as `export const CARD_LOADER_TESTIDS = { userSelect: '...' } as const`, consumed by template, spec, and selectors.ts.

---

## Cross-cutting recommendations

1. **Before writing a single product test**, lock down: fixture factories, route-table-per-page, typed handler bodies, `Mode` abstraction, retry/wait helpers, POS DSL.
2. **Add a CI guardrail** that asserts every `SEL.*.* ` literal appears in at least one template file — catches selector rot in <1s per CI run.
3. **Forbid raw Czech literals in `tests/**`** via a lint rule; force everything through `MSG`. If `MSG` is incomplete, the lint failure is the forcing function to expand it.
4. **Rename `nextId.goods`** to `goodsType` for the goodsType handler and add a `goods` (item) counter — current shared counter is a latent bug.
5. **Promote `cleanup`** to an `afterEach` and stop the silent catch.
6. **Type-only imports** from `src/` plus an ESLint `no-restricted-imports` rule banning runtime imports of app code from `e2e/**`.

---

**Findings: 18.**
