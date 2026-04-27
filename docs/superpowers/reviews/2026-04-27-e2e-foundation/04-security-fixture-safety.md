# E2E Foundation - Hostile Security & Fixture-Safety Review

**Reviewer:** Senior Test Developer #4 (security background)
**Date:** 2026-04-27
**Branch:** `redesign`
**Scope:** Playwright E2E foundation (16 commits) — `e2e/**`, `card-loader` debug feature

## Executive Summary

This foundation works in mock mode but is dangerously thin in real mode. The cleanup helper performs unguarded DELETE-by-prefix against whatever `E2E_BASE_URL` resolves to, with **no hostname allowlist, no production guard, and no dry-run** — a single misconfigured env var can wipe staging or production data named with the legitimate `e2e-` prefix. The same helper reads the JWT from the wrong localStorage key (`token` instead of `apiToken`), so cleanup will silently no-op in many configurations, masking accumulating test pollution. Mock-mode shortcuts (granting all permissions including `LogsRead`/`UserDelete`, hardcoded permission strings, paginated-but-unfiltered handlers, silent `console.warn` on unhandled routes, `body: any` typing, mock JWT with literal `.signature`) systematically mask permission, contract, and validation regressions. Fixture credentials are weak and the seed.sql ships with `$2a$10$REPLACE_WITH_BCRYPT_OF_<plaintext>` placeholders that **look syntactically like real bcrypt hashes** — if loaded into a non-test database the prefix tricks operators, and the plaintext password is one column-grep away. The `card-loader` debug surface is also a regression: enabling `localStorage.isDebug=true` in any browser exposes every user's card UID via a dropdown, with no server-side authorisation check beyond `isLogged`. Below: 16 numbered findings.

---

## 1. `cleanupE2eEntities` reads the wrong localStorage key — silent no-op (CRITICAL)

- **Severity:** critical
- **Location:** `e2e/support/cleanup.ts:13`
- **Threat model:** Any developer running `E2E_MODE=real`. No external attacker required.
- **Why it matters:** The auth adapter and the production `AuthService` both store the JWT under `apiToken` (see `auth-adapter.ts:55`, `auth-adapter.ts:90`, `auth.service.ts:45`). Cleanup reads `localStorage.getItem('token')` — a key that is never set. Result: `token` is `null`, the early return triggers, **cleanup never runs in real mode**. Test data accumulates indefinitely on the shared backend, and every test author who reads "cleans up after each test" believes a guarantee that does not hold. When someone eventually fixes the key, the now-functional DELETE loop will iterate over weeks of accumulated entities matching `e2e-*` and hammer the backend.
- **Fix:** Read `apiToken`, fail loudly if missing, and add a Playwright-level assertion that real-mode tests with cleanup actually issued at least one DELETE in dry-run smoke tests.

## 2. No production / staging guard on real-mode cleanup (CRITICAL)

- **Severity:** critical
- **Location:** `e2e/support/cleanup.ts:10-35`, `e2e/playwright.config.real.ts:10`
- **Threat model:** A developer copy-pastes a production `E2E_BASE_URL` (or an internal staging URL containing real customer data) into their shell, runs `npm run e2e:real`, and the loop issues `DELETE /api/v1.1/users/{id}` for every user whose name happens to start with `e2e-`. A festival operator who legitimately created `e2e-staff` or `e2e-test-bar` loses those records.
- **Why it matters:** There is **no allowlist** (`localhost`, `127.0.0.1`, internal CI host), **no `--allow-prod-deletion` opt-in flag**, **no environment file with checksum**, and **no log warning** when `E2E_BASE_URL` resolves outside an allowlist. The cleanup helper trusts `MODE === 'real'` and the configured base URL implicitly. Real-mode runs are weaponisable by accident.
- **Fix:** Hardcode an allowlist of acceptable hostnames (`['localhost','127.0.0.1','e2e.internal']`); abort with a loud error if the resolved baseURL hostname is not in the list. Require `E2E_ALLOW_DESTRUCTIVE=1` env var as a second factor. Print the target hostname before each test.

## 3. Prefix-based DELETE collides with legitimate user data (CRITICAL)

- **Severity:** critical
- **Location:** `e2e/support/cleanup.ts:4,27`
- **Threat model:** Production / staging contains an entity legitimately named `e2e-bar`, `e2e-test-bar`, `e2e-staff` (common practice for organizations that named their integration sandbox places "e2e-..."). Someone runs real-mode E2E against staging.
- **Why it matters:** `label.startsWith('e2e-')` is a string-prefix check with zero metadata distinguishing test fixtures from real entities. There is no marker column (`is_test=true`), no test-namespaced ID range, and no creation-window filter (e.g. "only delete entities created in the last hour"). Combined with finding 2, this is a destructive DDL by string prefix.
- **Fix:** Tag test entities at creation time via a side channel — either a dedicated `is_test` column on each table, an unmistakable prefix like `__pwtest_<runId>__`, or a per-run UUID baked into the name. Filter on `is_test=true AND created_at > NOW() - interval '1 hour'`. Never DELETE on prefix alone.

## 4. Mock JWT signature is the literal string `.signature` (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/jwt.ts:15`
- **Threat model:** Mixed-mode confusion. A test runs in mock mode, sets `apiToken = "<header>.<body>.signature"` in localStorage, then a developer accidentally points the dev server at a real backend (proxy.conf, env, or a stray `npm start` against a real API). The browser sends the unsigned token to a real signature-validating endpoint. Behaviour is undefined: a backend with permissive JWT verification (HS256 with weak/no secret check, `alg:none` accepted, dev-mode bypass) might honour it.
- **Why it matters:** `.signature` is base64url-decodable garbage rather than a clearly-malformed token. Combined with the all-permissions injection (finding 6), an accidental cross-mode run could authenticate as admin against a real backend. The token also has a 1-hour `exp` so it persists across page reloads.
- **Fix:** Make the signature glaringly invalid: `"INVALID_E2E_MOCK_TOKEN_DO_NOT_USE_AGAINST_REAL_BACKEND"`. Better, sign with a random per-run key and document that real backends must reject it. Best, refuse to inject into localStorage if `window.location.hostname` is not `localhost`.

## 5. `MockAuthAdapter` grants every permission inline (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/auth-adapter.ts:12-24,50`
- **Threat model:** Permission regressions. Production code adds a permission check `if (!hasPermission(EPermission.UserDelete)) reject()`. A bug renames the enum string from `UserDelete` to `UsersDelete`. Mocks grant the old hardcoded string, so the test passes; production users with new tokens lose the ability to delete users, but no test catches it.
- **Why it matters:** `ALL_PERMISSIONS` is a hardcoded string array decoupled from `EPermission` enum (commented as deliberate). This is exactly backward — the fixture should pin the contract, not paper over it. Test writes succeed where production reads fail. `LogsRead`, `UserDelete`, `CardDelete` granted indiscriminately make role-segregation tests impossible.
- **Fix:** Import `EPermission` and use `Object.values(EPermission)` so renames break compilation. Provide per-persona permission sets (admin, worker, member) via a switch on `user.roles[0]`, not a single global blanket.

## 6. Fixture passwords are weak and shared (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/data/users.ts:6-25`
- **Threat model:** Seed.sql is loaded into an environment that is reachable from outside the test network. Passwords `admin123`, `worker123`, `power123`, `pwd123` (used for 4 accounts) are top-1000 in any password list.
- **Why it matters:** It only takes one CI-runner misconfiguration, one engineer running the seed against a shared dev DB, one demo environment exposed to the public, and the admin account is `admin@test.cz / admin123`. The repeated `pwd123` across 4 users (Tomáš, Lucie, Ondřej, Eva) means a single guess unlocks four identities.
- **Fix:** Generate per-run passwords with high entropy in `sql-generator.ts` — 32-byte base64. Read passwords from a per-run file. If passwords must be deterministic for tests, gate the seed loader behind a `KREDSYS_TEST_DB_ONLY=1` env check that production rejects.

## 7. `seed.sql` placeholder format mimics real bcrypt prefix (MAJOR)

- **Severity:** major
- **Location:** `e2e/seed/seed.sql:16-25`, `e2e/fixtures/sql-generator.ts:52`
- **Threat model:** A migration script copies `password_hash` columns into a new system. The downstream system or operator sees `$2a$10$...` and assumes a valid bcrypt cost-10 hash; nobody catches it because the prefix is the canonical bcrypt identifier.
- **Why it matters:** The string `$2a$10$REPLACE_WITH_BCRYPT_OF_admin123` literally:
  1. Looks like a hash to any code that pattern-matches `$2[axyb]\$\d{2}\$`.
  2. Embeds the plaintext password directly after a recognizable separator (`REPLACE_WITH_BCRYPT_OF_`).
  Anyone who reads the column header "password_hash" does not stop to read the cell. A `grep -E '^\$2a\$10\$'` over a backup leaks plaintext credentials.
- **Fix:** Use a placeholder that **cannot** be confused with bcrypt: `__PLAINTEXT__admin123__BCRYPT_REQUIRED__`, no `$2a$` prefix. Better, the SQL generator should refuse to emit until passwords are bcrypted (call `bcrypt.hashSync(u.password, 10)` at generation time and embed only the resulting hash).

## 8. Real-mode token persists across browser sessions via `addInitScript` (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/auth-adapter.ts:53-58, 88-93`
- **Threat model:** Test isolation breach. `addInitScript` injects `apiToken` into `localStorage` for every page in the BrowserContext. Playwright reuses contexts across tests in some configurations (and across retries). A failed-and-retried real-mode test leaves a real backend JWT in the persistent context storage.
- **Why it matters:** No origin scoping is enforced — `addInitScript` runs on every navigation including third-party `iframe` redirects (login OAuth flows, payment widgets, embedded help docs). The token writes to whatever origin loads first, and a hostile origin could read it via `localStorage` if the test navigates there.
- **Fix:** Use `context.addCookies` with `httpOnly` + `secure` + `sameSite: 'Strict'` for a session cookie, OR scope `addInitScript` by origin allowlist (Playwright supports `page.route` precondition, but storage state should be cleared via `context.clearCookies()` and `localStorage.clear()` in afterEach). Always create a fresh context per test in real mode.

## 9. `process.env['E2E_MODE']` typo silently defaults to mock (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/auth-adapter.ts:6`
- **Threat model:** Symmetric typo risk. `E2E_MODE === 'real'` ? real : mock. A developer who types `E2E_MODE=Real` (capital R) or `E2E_MODE=true` runs in mock — relatively safe. **But the inverse is dangerous:** if a future refactor flips the default to `real` (e.g. `=== 'mock' ? mock : real`), a typo silently becomes destructive. There is also no validation that the value is one of the two known strings.
- **Why it matters:** Single point of failure. Combined with finding 2 (no hostname guard), a typo in a CI yaml `E2E_MODE: realt` becomes mock today, but there's nothing locking that semantics.
- **Fix:** Validate explicitly: `const m = process.env.E2E_MODE; if (m !== 'mock' && m !== 'real') throw new Error(...)`. Print mode + target URL on every Playwright run startup so accidents are loud.

## 10. Global Bluetooth stub masks real production NPE (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:91-104`
- **Threat model:** End users on Firefox, Safari, iOS Safari, or Chromium with `navigator.bluetooth` undefined hit a runtime NullPointerException in `PrintService` that no E2E test ever catches.
- **Why it matters:** The stub is unconditional and global (`addInitScript`). It guarantees `navigator.bluetooth` exists in every test, but real users on browsers without Web Bluetooth (everything except Chrome desktop and Edge) get the buggy code path. The comment "PrintService crashes the app without this stub" admits the production bug — and then patches it only in tests.
- **Fix:** Either (a) fix `PrintService` to feature-detect `navigator.bluetooth` before instantiating, and remove the stub, OR (b) add a dedicated test that **does not** install the stub and asserts the app still boots. Test parity with real users is non-negotiable.

## 11. `paginated()` returns unfiltered data — search tests pass locally, fail on real DB (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:80-88`, `e2e/fixtures/api-mock-handlers.ts:35-37` (and ~20 other GET handlers)
- **Threat model:** A developer writes a test "search for user `Karel`, expect one result". Mock paginates the full state.users list and the UI client-side filters — test passes. Real backend implements the search server-side; the URL parameters `query=Karel` are passed but the mock ignores them entirely. When the test runs against real mode, the backend filters server-side and may behave differently (case sensitivity, accent stripping, partial match rules), and tests start failing in CI.
- **Why it matters:** `pageParams(url)` reads `page` and `pageSize` but no other query parameters. There is no hook for `query`, `sortBy`, `roleFilter`, `blocked`, `placeId`, etc. Mock behaviour drifts from real silently.
- **Fix:** Wire the standard query params into a generic filter helper. Fail the test on unhandled query parameters (mock should reject `?role=Admin` rather than ignore it).

## 12. `installApiMock` matches `**/api/v1.1/**` only — config + asset fetches leak (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:106`
- **Threat model:** The app loads `assets/config.json`, `assets/i18n/*.json`, third-party CDN assets, and possibly `assets/version.json`. None match `**/api/v1.1/**` so they are unmocked and hit the real network. In real-mode, this is intended; in mock-mode against a CI runner with no internet, tests randomly fail with `ERR_NAME_NOT_RESOLVED`.
- **Why it matters:** Mock mode is supposed to be hermetic. It is not. Also, if `config.json` contains a `apiUrl` pointing at production, mock mode fetches real config and the app's own routing logic may re-target endpoints outside the mock pattern.
- **Fix:** Add explicit handlers for `**/assets/config.json` returning a known-test config. Default-deny everything outside the allowlist via `page.route('**/*', ...)` returning 404 for unmatched origins.

## 13. Unhandled mock routes only `console.warn` — silent contract drift (MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:113-114`
- **Threat model:** Production code adds a new endpoint `GET /api/v1.1/users/{id}/stats`. The mock has no handler. Test runs, returns 404 + `{}`, the component swallows the empty response, the test still passes by coincidence. The `console.warn` is invisible in CI logs that are tens of thousands of lines.
- **Why it matters:** Unhandled routes mean the mock has fallen behind the real API. The "404 + empty body" fallback is the worst possible default — it pretends success often enough to mask drift.
- **Fix:** In CI, fail the test on first unhandled route. Track unhandled routes per test in an array and `expect(unhandled).toEqual([])` in `afterEach`. At minimum return `503` not `404` so the component cannot mistake it for a normal "not found".

## 14. `body: any` and `tx: any` in mutation handlers accept malformed payloads (MINOR/MAJOR)

- **Severity:** major
- **Location:** `e2e/fixtures/api-mock.ts:47`, `e2e/fixtures/api-mock-handlers.ts:285,291,312,333,349`
- **Threat model:** Production form sends `{ items: [{price: "50", amount: 1}] }` (string, not number). Mock's `(s + i.price * i.amount)` becomes `"050"` (string concat). Test asserts on a totally garbage value but the assertion is vague (`.toBeTruthy()`), passes. Real backend rejects the string with 400; production breaks.
- **Why it matters:** TypeScript loophole exactly where validation matters. Any payload-shape contract drift slips through. Note also `state.transactions.unshift(tx)` mutates state — any test that runs after a mutation test sees pollution unless `createMockState()` is called per-test (it is, via `installApiMock` default arg, **but only if the caller does not pass an explicit state**).
- **Fix:** Define `interface PaymentPayload { items: { price: number; amount: number }[]; userId: number; placeId: number; }` and type each handler's `body`. Validate at handler entry; return 400 on shape mismatch.

## 15. `card-loader` debug dropdown leaks every user's card UID (CRITICAL)

- **Severity:** critical
- **Location:** `src/app/common/components/card-loader/card-loader.component.ts:88-109`, `src/app/common/components/card-loader/card-loader.component.html:40-50`
- **Threat model:** A regular logged-in worker / member opens browser devtools, runs `localStorage.setItem('isDebug','true')`, refreshes the page, and the dropdown now lists **every user's card UID**, which is the credential that authorises payments. There is no server-side check that the user is allowed to see other users' cards beyond `isLogged`. The component fetches `cards.getCards(0, 100)` and `usersService.getUser(id)` for each, which the backend should be permission-gating, but if the backend honours admin tokens or the request originates from a user who has `CardRead` for any reason (e.g. POS workers), this is a privacy regression.
- **Why it matters:** Card UID is effectively a bearer token in this domain — anyone who knows a UID can swipe it (or simulate a swipe) at a POS terminal to charge that user's account. Combined with `isDebug` being a client-controlled localStorage flag with no server enforcement, a malicious cashier walks away with every customer's card UID. The data-testid hooks make the surface easy to discover. This also runs in production builds (`environment.debug` is one factor; localStorage is the other) — there is no guard like `if (environment.production) return`.
- **Fix:** (1) Server must enforce `CardRead` for `GET /cards` and `GET /users/{id}` and return 403 otherwise. (2) Remove the dropdown entirely from production bundles via a build-time `@if (!environment.production)` (Angular's static analysis will dead-code-strip). (3) Move the debug feature behind a server-issued role flag, never a client-toggleable localStorage value. (4) Audit-log access to the dropdown.

## 16. `isDebug` is fully client-controlled (CRITICAL)

- **Severity:** critical
- **Location:** `src/app/modules/login/services/auth/auth.service.ts:26-32`, `card-loader.component.html:10`
- **Threat model:** Any logged-in user runs `localStorage.setItem('isDebug','true')` in devtools. The `@if (authService.isLogged && authService.isDebug)` gate trivially evaluates to true. Every debug-only UI in the app activates: card dropdown (finding 15), simulate-card button, possibly other debug menus elsewhere in the codebase.
- **Why it matters:** `isDebug` is the gating flag for debug-only UI surfaces, but its only sources are (a) `localStorage` (user-writable) and (b) `environment.debug` (build-time). There is no server attestation. The auth adapter happily sets it `true` for every E2E user — which is fine for tests, but the same code path exists in production. An attacker doesn't need to compromise anything: open devtools, type one command.
- **Fix:** Replace `isDebug` with a server-issued claim in the JWT (`debug: true` only for users with an admin role and only when the backend was started with `--debug-allowed`). Validate the claim cryptographically in the AuthService getter. Treat `localStorage.isDebug` as untrusted input and ignore it in production builds.

---

## Aggregate severity

- **Critical:** 1 (cleanup wrong key), 2 (no prod guard), 3 (prefix collision), 15 (card UID leak), 16 (client-controlled isDebug) = **5**
- **Major:** 4 (mock JWT signature), 5 (all-perms inline), 6 (weak passwords), 7 (bcrypt-lookalike placeholder), 8 (token persistence), 9 (env typo), 10 (bluetooth stub), 11 (paginated unfiltered), 12 (mock scope leak), 13 (silent unhandled), 14 (`any` types) = **11**
- **Minor:** 0

**Total: 16 findings.**

## Recommended order of remediation

1. **Today (block merge):** Findings 1, 2, 3 — cleanup is unsafe in real mode. Findings 15, 16 — debug feature leaks card UIDs in production.
2. **This week:** Findings 4, 5, 7, 8 — auth/secret hygiene.
3. **This sprint:** Findings 6, 9, 10, 11, 12, 13, 14 — fixture and mock contract hardening.

## Files reviewed (all paths absolute)

- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/auth-adapter.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/jwt.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/api-mock.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/api-mock-handlers.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/sql-generator.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/data/users.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/data/cards.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/data/places.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/fixtures/data/index.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/support/cleanup.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/seed/seed.sql`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/playwright.config.real.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/e2e/playwright.config.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/src/app/common/components/card-loader/card-loader.component.ts`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/src/app/common/components/card-loader/card-loader.component.html`
- `/home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/src/app/modules/login/services/auth/auth.service.ts`
