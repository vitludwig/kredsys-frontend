---
name: Playwright E2E Tests — Design
description: Design spec for the full Playwright E2E test suite — mocked HTTP layer, role personas, NFC bypass, SQL seed generation, dual-mode (mock/real backend) support
date: 2026-04-26
status: approved
---

# Playwright E2E Tests — Design

## Goal

Build a Playwright E2E test suite covering the critical user flows of the Kredsys frontend (Angular 21 SPA — credit/wallet system for events). The suite must:

- Run fully offline against a mocked HTTP layer by default (`E2E_MODE=mock`).
- Be switchable to a real backend (`E2E_MODE=real`) with no test-code changes.
- Emit a `seed.sql` file from the same fixture data, so the real backend can be seeded with an identical dataset.
- Cover ~80 tests across 11 functional areas (login, guards, sale/POS, admin CRUD for users/places/goods/currencies/transactions/charge, groups, check-in, card-info).
- Skip Web Bluetooth (printer) entirely. Use the existing `CardLoaderComponent` debug mode for NFC simulation.

## Non-Goals

- Backend contract testing (mocked layer is the source of truth for API shapes; contract drift is a separate concern).
- Web Bluetooth printer testing.
- Visual regression testing.
- Performance / load testing.
- Cross-browser matrix (Chromium only — Web NFC and Web Bluetooth are Chromium-only anyway, and the app is currently shipped for Chromium-class browsers).
- CI pipeline implementation (acknowledged as out-of-scope; the design leaves room for it but does not implement it).

## Decisions Recap

| Decision | Choice | Rationale |
|---|---|---|
| Mocking strategy | Full HTTP mock via `page.route()`, with mode switch to real backend | Frontend tests test the frontend; deterministic; offline-capable |
| Coverage depth | (B) Critical user flows + role-based access + form validation + edge cases (~80 tests) | Sweet spot between regression safety and maintenance cost |
| Hardware (NFC) | Use existing `CardLoaderComponent` debug mode (gated by `localStorage.isDebug='true'`) | Zero production code change, realistic flow |
| Hardware (printer) | Skip entirely | Not safety-critical; out of scope |
| Selectors | Proactively add `data-testid` on key elements before writing tests | Stable, self-documenting; one sweep commit |
| Test names language | English | Standard code convention |
| UI text assertions | Czech, via constants in `support/messages.ts` | Centralized, easy to update on UI text changes |

## Architecture

### Directory Layout

```
e2e/
├── playwright.config.ts          # Chromium-only project; webServer in mock mode
├── playwright.config.real.ts     # extends config.ts; no webServer (assumes external)
├── fixtures/
│   ├── data/                     # TypeScript fixture data (single source of truth)
│   │   ├── users.ts
│   │   ├── places.ts
│   │   ├── goods.ts
│   │   ├── goods-types.ts
│   │   ├── currencies.ts
│   │   ├── currency-accounts.ts
│   │   ├── cards.ts
│   │   ├── transactions.ts
│   │   ├── groups.ts
│   │   ├── user-groups.ts
│   │   └── index.ts
│   ├── api-mock.ts               # page.route() registry → fixtures
│   ├── auth-adapter.ts           # MockAuthAdapter / RealAuthAdapter
│   └── sql-generator.ts          # fixtures → seed.sql
├── support/
│   ├── personas.ts               # test.extend with asAdmin/asWorker/asMember/asPowerSalesman
│   ├── pos.ts                    # scanCard, scanNewCard, addToBasket, submitOrder helpers
│   ├── selectors.ts              # SEL constants matching data-testid
│   ├── messages.ts               # Czech UI text constants
│   └── cleanup.ts                # cleanupE2eEntities (real-mode afterEach)
├── tests/
│   ├── auth/
│   ├── guards/
│   ├── sale/
│   ├── admin/
│   │   ├── users/
│   │   ├── places/
│   │   ├── goods/
│   │   ├── currencies/
│   │   ├── transactions/
│   │   ├── charge/
│   │   └── groups/
│   ├── check-in/
│   └── card-info/
├── seed/
│   └── seed.sql                  # generated artifact (committed)
└── README.md
```

### Mode Switching

Single env var: `E2E_MODE` ∈ `{mock, real}`. Default `mock`.

```bash
npm run e2e                 # mock mode
E2E_MODE=real npm run e2e   # real backend
npm run e2e:gen-sql         # regenerate seed.sql from fixtures
```

In `mock` mode:
- `installApiMock(page)` registers `page.route('**/api/v1.1/**', ...)`.
- `MockAuthAdapter` injects a fake JWT directly into `localStorage` via `addInitScript`.
- Mutations (POST/PUT/DELETE) mutate per-test cloned state; following GETs see the changes.
- `webServer` block in `playwright.config.ts` boots `ng serve` automatically.

In `real` mode:
- No `page.route()` interception — requests pass through Vite proxy to backend.
- `RealAuthAdapter` performs an actual `POST /api/v1.1/authentication/user/email`.
- Mutating tests use unique `e2e-` prefixed entity names; `afterEach` cleanup deletes them.
- Backend is assumed to be running with `seed.sql` loaded; `playwright.config.real.ts` does not start one.
- Tests that simulate HTTP errors (5xx, network failure) are skipped via `test.skip(MODE === 'real', ...)`.

## Fixture System

### Principle

Fixtures are TypeScript modules. They are imported directly by tests (named exports for individual entities) and consumed by both the mock layer and the SQL generator. There is **one** source of truth.

### Example

```typescript
// e2e/fixtures/data/users.ts
import { IUser, EUserRole } from '../../../src/app/common/types/...';

export type FixtureUser = IUser & { id: number; password: string };

export const users: FixtureUser[] = [
  { id: 1, name: 'Admin Adminský',    email: 'admin@test.cz',   password: 'admin123',
    memberId: 1001, roles: [EUserRole.ADMIN],          blocked: false },
  { id: 2, name: 'Pavel Pokladní',    email: 'worker@test.cz',  password: 'worker123',
    memberId: 1002, roles: [EUserRole.WORKER],         blocked: false },
  { id: 3, name: 'Petr PowerSales',   email: 'power@test.cz',   password: 'power123',
    memberId: 1003, roles: [EUserRole.POWER_SALESMAN], blocked: false },
  { id: 4, name: 'Marie Členka',      email: 'member@test.cz',  password: 'member123',
    memberId: 1004, roles: [EUserRole.MEMBER],         blocked: false, groups: [1] },
  { id: 5, name: 'Jana Zákaznice',    email: 'jana@test.cz',    password: 'jana123',
    memberId: 1005, roles: [EUserRole.MEMBER],         blocked: false, groups: [1, 2] },
  { id: 6, name: 'Karel Zablokovaný', email: 'karel@test.cz',   password: 'karel123',
    memberId: 1006, roles: [EUserRole.MEMBER],         blocked: true },
  // ... ~10 additional realistic customers for tables/pagination/search
];

export const adminUser   = users[0];
export const workerUser  = users[1];
export const powerUser   = users[2];
export const memberUser  = users[3];
export const janaUser    = users[4];   // overdraft scenario
export const blockedUser = users[5];
```

### Dataset Scope

| Fixture | Count | Notes |
|---|---|---|
| users | ~10 | Includes one of each role + blocked + ~5 generic customers |
| places | 3 | Bar, Bar (overlap sortiment), Registration |
| goodsTypes | 4 | e.g. drink, food, merch, service |
| goods | ~12 | Distributed across types and places |
| currencies | 2 | Default + secondary (one blocked for blocked-toggle test) |
| currencyAccounts | ~10 | Includes pre-seeded overdraft scenarios for Jana |
| cards | ~15 | uid ↔ user mapping; first 3 user IDs are sale-flow personas |
| transactions | ~30 | Spread across last 90 days for statistics tests |
| groups | 3 | Color-distinct for picker tests |

### Scenario-Driven Entities

Because real-mode cannot mutate state per test, edge cases must be **pre-seeded as dedicated entities**:

- **Jana** — balance 50, overdraftLimit 100 → covers overdraft warning AND limit-exceeded scenarios via different basket sizes.
- **Karel** — `blocked: true` → tests blocked-user login error.
- **Empty Place** — Place with no goods → tests empty filter panel and grid.
- **Currency "BlockedCoin"** — `blocked: true` → tests currency blocked toggle.
- Test-data covers paginated lists (≥ pageSize + few extras).

In mock mode, these are all just data. In real mode, they're loaded from `seed.sql` once.

### Card Loader Constraint

`CardLoaderComponent` shows the first 3 user IDs that have cards (per `slice(0, 3)`). Fixtures must order `cards.ts` so that **Marie**, **Jana**, and one PowerSales customer are in the first three — that's what tests will scan.

## Mock Layer

### Router

Centralized `installApiMock(page)`:

```typescript
// e2e/fixtures/api-mock.ts
export interface MockState {
  users: FixtureUser[];
  places: IPlace[];
  goods: IGoods[];
  accounts: ICurrencyAccount[];
  transactions: ITransaction[];
  // ...
}

export function createMockState(): MockState {
  return {
    users: structuredClone(users),
    places: structuredClone(places),
    goods: structuredClone(goods),
    accounts: structuredClone(currencyAccounts),
    transactions: structuredClone(transactions),
    // ...
  };
}

export async function installApiMock(page: Page, state = createMockState()) {
  await page.route('**/api/v1.1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api/v1.1/', '');
    const handler = matchRoute(req.method(), path);
    if (!handler) {
      console.warn(`[mock] unhandled ${req.method()} ${path}`);
      return route.fulfill({ status: 404, body: '{}' });
    }
    const result = await handler({ url, body: req.postDataJSON(), state });
    return route.fulfill({
      status: result.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(result.body),
    });
  });
  return state;
}
```

### Endpoint Map

Derived from `docs/services.md` (final exact paths verified during implementation against actual service code):

| Service | Endpoint | Handler behavior |
|---|---|---|
| `AuthService.login` | `POST /authentication/user/email` | Match email+password in fixtures → return `{ token: <mockJwt> }` or 401 |
| `UsersService.getUsers` | `GET /users` | Return `state.users` |
| `UsersService.getUser` | `GET /users/:id` | Lookup |
| `UsersService.createUser` | `POST /users` | Append + return new id |
| `UsersService.updateUser` | `PUT /users/:id` | Mutate in place |
| `UsersService.deleteUser` | `DELETE /users/:id` | Remove |
| `PlaceService.*` | `/places`, `/places/:id`, `/places/:id/goods` | CRUD + sortiment |
| `GoodsService.*` | `/goods`, `/goods/types` | CRUD |
| `CurrencyService.*` | `/currencies`, `/users/:id/currency-account` | CRUD + balance lookup |
| `SaleService.submitOrder` | `POST /sale/order` | Decrement balance, append transaction |
| `SaleService.charge` / `discharge` | `POST /sale/charge` / `discharge` | Adjust balance + tx |
| `SaleService.storno` | `POST /sale/storno/:id` | Reversal tx + balance restore |
| `TransactionService.*` | `/transactions`, `/transactions/statistics` | Paginated filter + aggregate |
| `CardsService.getCards` | `GET /cards` | List |
| `GroupsService.*` | `/groups`, `/groups/statistics` | CRUD + chart data |

### Per-Test Override Hook

For HTTP-level edge cases (5xx, network failure), tests can layer additional `page.route()` calls **after** `installApiMock`:

```typescript
test('500 on user save → error alert', async ({ page }) => {
  await installApiMock(page);
  await page.route('**/api/v1.1/users', (r) =>
    r.request().method() === 'POST' ? r.fulfill({ status: 500 }) : r.continue()
  );
  // ...
});
```

These tests are skipped in real mode.

## Auth & Personas

### AuthAdapter

```typescript
// e2e/fixtures/auth-adapter.ts
export interface AuthAdapter {
  loginAs(page: Page, user: FixtureUser): Promise<void>;
  selectPlace(page: Page, place: IPlace): Promise<void>;
}

class MockAuthAdapter implements AuthAdapter {
  async loginAs(page: Page, user: FixtureUser) {
    const token = createMockJwt({
      sub: String(user.id),
      name: user.name,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await page.addInitScript(([t, debug]) => {
      localStorage.setItem('token', t);
      if (debug) localStorage.setItem('isDebug', 'true');
    }, [token, true]);
  }

  async selectPlace(page: Page, place: IPlace) {
    await page.addInitScript((p) => {
      localStorage.setItem('selectedPlace', JSON.stringify(p));
    }, place);
  }
}

class RealAuthAdapter implements AuthAdapter {
  async loginAs(page: Page, user: FixtureUser) {
    const ctx = page.request;
    const res = await ctx.post('/api/v1.1/authentication/user/email', {
      data: { email: user.email, password: user.password },
    });
    const { token } = await res.json();
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('isDebug', 'true');
    }, token);
  }

  async selectPlace(page: Page, place: IPlace) {
    // Same localStorage-based approach if PlaceService persists selection there;
    // otherwise navigate via UI in real mode (helper handles both).
  }
}

export const authAdapter: AuthAdapter = process.env.E2E_MODE === 'real'
  ? new RealAuthAdapter()
  : new MockAuthAdapter();
```

`selectedPlace` storage location to be verified against `PlaceService` during implementation.

### `createMockJwt` helper

```typescript
function createMockJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}
```

(Reused from existing unit tests per `docs/testing.md`.)

### Persona Fixture

```typescript
// e2e/support/personas.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  mockState: MockState | null;
  asAdmin: Page;
  asWorker: Page;
  asPowerSalesman: Page;
  asMember: Page;
}>({
  mockState: async ({ page }, use) => {
    if (MODE === 'mock') {
      const state = await installApiMock(page);
      await use(state);
    } else {
      await use(null);
    }
  },
  asAdmin: async ({ page, mockState }, use) => {
    await authAdapter.loginAs(page, adminUser);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },
  asWorker: async ({ page, mockState }, use) => {
    await authAdapter.loginAs(page, workerUser);
    await authAdapter.selectPlace(page, place1);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },
  asPowerSalesman: async ({ page, mockState }, use) => {
    await authAdapter.loginAs(page, powerUser);
    await authAdapter.selectPlace(page, place1);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },
  asMember: async ({ page, mockState }, use) => {
    await authAdapter.loginAs(page, memberUser);
    await use(page);
  },
});
```

### Login Flow

The login form is exercised only in `tests/auth/login.spec.ts` (positive + negative paths). All other tests skip the form and start authenticated.

## Hardware Bypass (NFC)

The component already handles all hardware concerns when `localStorage.isDebug === 'true'`:

1. **Existing card scan** — `CardLoaderComponent` renders buttons named after the first 3 users with cards. Click by name:
   ```typescript
   export async function scanCard(page: Page, userName: string) {
     await page.getByRole('button', { name: userName }).click();
     await expect(page.getByText('Načtěte kartu')).toBeHidden();
   }
   ```

2. **New card scan** (check-in flow) — override `Math.random()` for deterministic UID:
   ```typescript
   export async function scanNewCard(page: Page, uid: number) {
     await page.evaluate((u) => {
       const target = (u - 1_000_000_000) / 9_000_000_000;
       Math.random = () => target;
     }, uid);
     await page.getByRole('button', { name: 'Simulovat novou kartu' }).click();
   }
   ```
   Fallback if fragile: simulate fast keydown sequence ending in Enter (component's `initCardListener` supports it).

3. **Card-info direct UID** — `page.goto('/card-info?uid=XXX')` (exact param name verified in implementation).

Out of scope: Web Bluetooth (printer), Czech-keyboard diacritics conversion (better as unit test).

## `data-testid` Sweep

Single commit before writing tests. Adds ~50 attributes. Convention: `<modul>-<entita>-<akce>`, kebab-case.

| Area | testids |
|---|---|
| Login | `login-email`, `login-password`, `login-submit`, `login-error` |
| Navigation | `nav-sale`, `nav-admin-users`, `nav-admin-places`, `nav-admin-goods`, `nav-admin-currencies`, `nav-admin-transactions`, `nav-admin-charge`, `nav-admin-groups`, `nav-check-in`, `nav-card-info`, `nav-logout`, `nav-debug-toggle`, `top-menu-balance`, `top-menu-place` |
| List rows | `row-${entity}-${id}` for users/places/goods/currencies/transactions/groups |
| Row actions | `row-action-edit`, `row-action-delete`, `row-action-change-password` |
| CRUD forms | `form-<field>` (e.g. `form-name`, `form-email`, `form-price`, `form-color`); `form-submit`, `form-cancel`, `form-delete` |
| POS | `sale-summary-total`, `sale-summary-total-left`, `sale-submit`, `sale-clear`, `sale-overdraft-warning`, `filter-panel-${typeId}`, `goods-tile-${goodsId}`, `basket-item-${goodsId}`, `basket-item-remove` |
| Dialogs | `confirm-yes`, `confirm-no`, `charge-amount`, `charge-submit`, `discharge-amount`, `discharge-submit`, `storno-confirm`, `assign-card-submit` |
| Card-info | `card-info-balance`, `card-info-qr`, `card-info-group-${id}` |
| Check-in | `checkin-member-id`, `checkin-name`, `checkin-email`, `checkin-group`, `checkin-submit` |
| Place select | `place-option-${id}` |
| Transactions | `tx-tab-all`, `tx-tab-place`, `tx-tab-user`, `tx-row-${id}`, `tx-row-storno-btn`, `tx-filter-from`, `tx-filter-to` |
| Snackbars | `alert-success`, `alert-error`, `alert-info` |

**Excluded** (use Playwright role/text locators instead):
- Material buttons with visible labels → `getByRole('button', { name })`
- Form labels → `getByLabel('Email')`
- Card-loader debug buttons → `getByRole('button', { name: userName })` (dynamic per fixture)

**Constants in `support/selectors.ts`** to avoid magic strings in tests:

```typescript
export const SEL = {
  login: { email: 'login-email', password: 'login-password', submit: 'login-submit' },
  pos:   { submit: 'sale-submit', total: 'sale-summary-total', overdraft: 'sale-overdraft-warning' },
  // ...
} as const;
```

## Test Inventory

Total: **~80 tests** across 11 directories. All test names in English; Czech UI text assertions go through `support/messages.ts` constants.

### `tests/auth/` (~10)
- Login: admin / worker / powerSalesman / member each lands on the correct landing URL
- Login: wrong password → error alert
- Login: blocked user → error alert
- Auto-login from localStorage token → user authenticated after reload
- 401 from API → automatic logout + redirect to login (interceptor)
- UI logout → clears token, redirects to login
- Return URL: attempt `/admin/users` without token → after login proceeds to `/admin/users`

### `tests/guards/` (~6)
- `authGuard` redirects unauthenticated requests to login
- `placeGuard` redirects worker without selected place to `/place-select`
- `placeGuard` allows access to `/sale` after place is selected
- `unsavedChangesGuard` warns when navigating away from edited place sortiment
- Member cannot access `/admin/*` (redirect)
- Worker without admin role does not see admin links in menu

### `tests/sale/` (~14)
- Place select redirects to `/sale`
- Scan known card → customer loads, balance shown
- Click product → adds to basket, total increments
- Click product again → quantity increases
- Remove basket item → total decreases
- Filter panel filters product grid by goods type
- Submit order → success alert, basket cleared, balance updated in topbar
- Submit disabled with empty basket
- Overdraft warning when basket exceeds positive balance but within overdraft limit
- Submit disabled when basket exceeds overdraft limit
- Charge dialog: top up by amount → balance increases
- Discharge dialog: withdraw by amount → balance decreases
- Storno dialog: reverses a transaction → success, removed from list
- Customer logout clears basket, returns to card scan view

### `tests/admin/users/` (~8)
- List shows all users; pagination works; search filter
- Create form submission succeeds and entity appears in list
- Create form validation: required fields → error messages
- Create with duplicate email → error alert
- Edit user name → success, list reflects change
- Delete user with confirm → entity removed
- Change password form submits successfully
- Role assignment + blocked toggle persist

### `tests/admin/places/` (~6)
- List, Create with validation, Edit, Delete
- Drag-drop sortiment enables "potvrdit změnu pozice", saves
- Navigation away with unsaved drag-drop change triggers `unsavedChangesGuard`

### `tests/admin/goods/` (~6)
- List, Create with validation, Edit, Delete (goods)
- List, Create, Edit (goods type)

### `tests/admin/currencies/` (~4)
- List, Create with validation, Edit
- Blocked toggle persists

### `tests/admin/transactions/` (~6)
- List paginates and filters by date range
- Tabs (all / by place / by user) show correctly filtered data
- Statistics aggregation matches fixture expectations
- Storno from row → success, transaction reflects reversal
- Manual transaction entry submits successfully

### `tests/admin/charge/` (~4)
- Scan customer card + charge → balance increases
- Scan customer card + discharge → balance decreases
- Validation: rejects zero/negative amount

### `tests/admin/groups/` (~6)
- List, Create with color picker, Edit, Delete
- Group statistics chart renders (canvas presence + no console error)

### `tests/check-in/` (~4)
- Fill registration form, scan new card, submit → success
- Validation: required fields
- Existing memberId → error
- Group picker selection persists

### `tests/card-info/` (~5)
- Authenticated `/card-info` shows balance + QR code
- Public `/public/card-info?uid=XXX` shows balance (no auth)
- Config dialog opens and closes
- Groups display matches fixture
- Unknown UID → empty state

### Cross-cutting (in mock mode only)
- 500 from a representative mutating endpoint → error alert
- Offline / network failure → error alert

## SQL Seed Generator

### CLI

```bash
npm run e2e:gen-sql            # writes e2e/seed/seed.sql (Postgres flavor by default)
SQL_DIALECT=mysql npm run e2e:gen-sql   # future, if needed
```

`seed.sql` is committed to git so backend devs can review schema assumptions without running the script.

### Output Skeleton

```sql
-- Generated from e2e/fixtures/data — do not edit by hand.
-- Run: npm run e2e:gen-sql
BEGIN;

-- USERS
-- NOTE: password_hash placeholders contain plaintext for migration to bcrypt.
INSERT INTO users (id, name, email, password_hash, member_id, blocked) VALUES
  (1, 'Admin Adminský',    'admin@test.cz',  '$2a$10$REPLACE_WITH_BCRYPT_OF_admin123',  1001, false),
  (2, 'Pavel Pokladní',    'worker@test.cz', '$2a$10$REPLACE_WITH_BCRYPT_OF_worker123', 1002, false),
  -- ...
;
SELECT setval('users_id_seq', 100);

-- USER_ROLES
INSERT INTO user_roles (user_id, role) VALUES
  (1, 'Admin'),
  (2, 'Worker'),
  -- ...
;

-- PLACES
INSERT INTO places (id, name, type) VALUES (...);

-- ... goods_types, goods, place_goods, currencies,
--     currency_accounts, cards, transactions, groups, user_groups

COMMIT;
```

### Schema Assumptions

Documented as TODO comments at the top of `seed.sql` so backend devs see them:

- snake_case columns (`member_id`, `created_at`)
- Junction tables: `user_roles(user_id, role)`, `user_groups(user_id, group_id)`, `place_goods(place_id, goods_id, position)`
- `password_hash` is bcrypt — migration step or backend dev must hash the plaintext (provided in placeholder)
- Postgres-flavor (`setval`, `::timestamptz`); other dialects via env var

Backend will likely need minor column-name adjustments. The generator is idempotent — re-run after fixture changes.

## CI / Future Work

Out of scope for this design but anticipated:

- GitLab CI job `e2e:mock` on every MR (fast, no external deps)
- GitLab CI job `e2e:real` manual / nightly (requires backend in docker-compose with seed.sql loaded)
- Playwright HTML report uploaded as artifact
- Trace on first retry (Playwright default)

## Risks & Open Questions

1. **`selectedPlace` persistence location** — assumed localStorage; verify against `PlaceService` during implementation. If it's purely in-memory, `MockAuthAdapter.selectPlace` must navigate via UI instead of injecting.
2. **Exact API endpoint paths** — `services.md` is the design reference; final paths verified against actual service code during mock implementation. Mock layer must log unmatched routes (built in).
3. **Password hashing in seed.sql** — generator emits placeholders; backend integration requires either a migration script or a one-time bcrypt step. Acceptable since seed.sql is intended for dev/test environments only.
4. **Card-loader's first-3-users limit** — fixtures must order `cards.ts` so that scan-target users (Marie, Jana, one PowerSales) are in the first three. Enforce via test in `e2e:gen-sql` or unit assertion at module load.
5. **`Math.random()` override for new card UID** — if fragile across browsers, fall back to keyboard-burst simulation.
6. **Dual-mode test count** — ~5-10 tests will be skipped in real mode (HTTP error simulations). Acceptable.

## Out of Scope

- CI pipeline implementation
- Web Bluetooth printer testing
- Visual regression / screenshot diffing
- Cross-browser (Firefox, WebKit) — Web NFC/BT are Chromium-only
- Performance / load testing
- Accessibility (a11y) testing
- Backend contract testing
