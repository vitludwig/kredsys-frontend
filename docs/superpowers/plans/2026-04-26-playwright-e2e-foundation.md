# Playwright E2E — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of the E2E test suite — Playwright config, fixture data (single source of truth), HTTP mock layer, dual-mode auth adapter, persona fixtures, helpers, SQL seed generator, and one smoke test proving the entire stack works end-to-end.

**Architecture:** Mocked HTTP via `page.route()` (default `E2E_MODE=mock`), switchable to real backend (`E2E_MODE=real`). TypeScript fixtures are the single source of truth — same data feeds the mock router and the SQL generator. Test personas are injected via `addInitScript` (mock) or actual login (real). NFC scan uses an extended `CardLoaderComponent` debug dropdown.

**Tech Stack:** Playwright 1.x (Chromium only), TypeScript, the existing Angular 21 dev server (`ng serve`).

**Spec reference:** `docs/superpowers/specs/2026-04-26-playwright-e2e-tests-design.md`

**Out of scope (future plans):**
- Plan 2 — Auth + Guards tests
- Plan 3 — Sale tests
- Plan 4 — Admin CRUD tests
- Plan 5 — Misc tests (check-in, card-info, groups)

---

## File Structure (created by this plan)

```
e2e/
├── playwright.config.ts            # Chromium project, webServer for ng serve, mock mode default
├── playwright.config.real.ts       # extends config.ts, no webServer
├── tsconfig.json                   # E2E TS config (excludes from app build)
├── fixtures/
│   ├── data/
│   │   ├── users.ts
│   │   ├── places.ts
│   │   ├── goods-types.ts
│   │   ├── goods.ts
│   │   ├── currencies.ts
│   │   ├── currency-accounts.ts
│   │   ├── cards.ts
│   │   ├── groups.ts
│   │   ├── user-groups.ts
│   │   ├── transactions.ts
│   │   └── index.ts                # barrel export
│   ├── jwt.ts                      # createMockJwt helper
│   ├── api-mock.ts                 # page.route() registry + handlers
│   ├── auth-adapter.ts             # MockAuthAdapter / RealAuthAdapter
│   └── sql-generator.ts            # fixtures → seed.sql
├── support/
│   ├── personas.ts                 # test.extend with asAdmin/asWorker/etc.
│   ├── pos.ts                      # scanCard, scanNewCard helpers
│   ├── selectors.ts                # SEL constants (data-testid keys)
│   ├── messages.ts                 # Czech UI text constants
│   └── cleanup.ts                  # real-mode afterEach cleanup
├── tests/
│   └── smoke.spec.ts               # proves the stack works
├── seed/
│   └── seed.sql                    # generated, committed
└── README.md
```

**Modified production code:**
- `~50 templates` — sweep adding `data-testid` attributes (Task 3)
- `src/app/common/components/card-loader/card-loader.component.{ts,html}` — debug-only user dropdown (Task 4)

---

## Tasks

### Task 1: Install Playwright, scripts, base configs

**Files:**
- Modify: `package.json`
- Create: `e2e/playwright.config.ts`
- Create: `e2e/playwright.config.real.ts`
- Create: `e2e/tsconfig.json`
- Create: `.gitignore` (append)

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test@^1.48.0
npx playwright install chromium
```

Expected: `@playwright/test` appears in `package.json` devDependencies.

- [ ] **Step 2: Add npm scripts**

Open `package.json` → `scripts` and add:

```json
"e2e": "playwright test --config=e2e/playwright.config.ts",
"e2e:headed": "playwright test --config=e2e/playwright.config.ts --headed",
"e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
"e2e:real": "E2E_MODE=real playwright test --config=e2e/playwright.config.real.ts",
"e2e:gen-sql": "tsx e2e/fixtures/sql-generator.ts",
"e2e:report": "playwright show-report e2e/playwright-report"
```

Install `tsx` (used to run the SQL generator script):

```bash
npm install --save-dev tsx
```

- [ ] **Step 3: Create `e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    // ng serve (Vite); npm start in this project runs the Express prod server, not what we want for E2E
    command: 'npx ng serve --proxy-config src/proxy.conf.json',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    cwd: '..',
  },
});
```

- [ ] **Step 4: Create `e2e/playwright.config.real.ts`**

```typescript
import baseConfig from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  // In real mode, the backend + frontend are assumed to be already running.
  // Override BASE_URL via env if needed.
  use: {
    ...baseConfig.use,
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
  },
  webServer: undefined,
});
```

- [ ] **Step 5: Create `e2e/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "es2022",
    "types": ["node"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "strict": true
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 6: Exclude e2e from main app build**

Open `tsconfig.app.json` and add `"e2e/**/*"` to `exclude`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./out-tsc/app", "types": [] },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"],
  "exclude": ["e2e/**/*"]
}
```

Same for `tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./out-tsc/spec", "types": ["jasmine"] },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"],
  "exclude": ["e2e/**/*"]
}
```

- [ ] **Step 7: Update `.gitignore`**

Append to `.gitignore`:

```
# Playwright
e2e/test-results/
e2e/playwright-report/
e2e/playwright/.cache/
```

- [ ] **Step 8: Verify config loads**

```bash
npx playwright test --config=e2e/playwright.config.ts --list
```

Expected: prints `0 tests` (no test files yet) without parse errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore tsconfig.app.json tsconfig.spec.json e2e/playwright.config.ts e2e/playwright.config.real.ts e2e/tsconfig.json
git commit -m "chore(e2e): add Playwright config and npm scripts"
```

---

### Task 2: Add `data-testid` sweep (single mechanical commit)

This is one large commit touching many templates. The list below is exhaustive — copy-paste exactly. Do not add testids beyond this list (kept minimal per the spec; everything else uses Playwright role/text locators).

**Files:** ~30 templates across `src/app`. Each gets one or more `data-testid` attributes.

Run `git status` after each subsection to confirm only the expected files changed.

- [ ] **Step 1: Login**

Modify `src/app/modules/login/login.component.html` — find the email input, password input, submit button, and error display:

- email input → add `data-testid="login-email"`
- password input → add `data-testid="login-password"`
- submit button → add `data-testid="login-submit"`
- error display element (mat-error or div with the error text) → add `data-testid="login-error"`

- [ ] **Step 2: Top + Side menu**

Modify `src/app/common/modules/menu/components/top-menu/top-menu.component.html`:
- balance display → `data-testid="top-menu-balance"`
- selected place display → `data-testid="top-menu-place"`

Modify `src/app/common/modules/menu/components/side-menu/side-menu.component.html`. Each `<a [routerLink]>` link gets a `data-testid` matching its target:
- sale link → `nav-sale`
- admin/users → `nav-admin-users`
- admin/places → `nav-admin-places`
- admin/goods → `nav-admin-goods`
- admin/currencies → `nav-admin-currencies`
- admin/transactions → `nav-admin-transactions`
- admin/charge → `nav-admin-charge`
- admin/groups → `nav-admin-groups`
- check-in → `nav-check-in`
- card-info → `nav-card-info`
- logout button → `nav-logout`
- debug toggle → `nav-debug-toggle`

- [ ] **Step 3: Card loader (debug controls)**

Modify `src/app/common/components/card-loader/card-loader.component.html`. Inside the `@if (authService.isLogged && authService.isDebug)` block:
- "Simulovat novou kartu" button → `data-testid="card-loader-debug-new-card"`
- (The user-select dropdown will be added in Task 4 with its own testid `card-loader-debug-user-select`.)

- [ ] **Step 4: Admin lists — User list**

Modify `src/app/modules/admin/modules/users/components/user-list/user-list.component.html`:
- each `<tr>` for a user → `[attr.data-testid]="'row-user-' + user.id"`
- edit button (or routerLink) in row → `data-testid="row-action-edit"`
- delete button in row → `data-testid="row-action-delete"`
- change-password button in row → `data-testid="row-action-change-password"`

- [ ] **Step 5: Admin lists — Place / Goods / Currency / Group list**

Apply the same row pattern (`row-place-{id}`, `row-goods-{id}`, `row-currency-{id}`, `row-group-{id}`) plus `row-action-edit` / `row-action-delete` to:
- `src/app/modules/admin/modules/places/components/place-list/place-list.component.html`
- `src/app/modules/admin/modules/goods/components/goods-list/goods-list.component.html`
- `src/app/modules/admin/modules/currencies/components/currency-list/currency-list.component.html`
- `src/app/modules/groups/components/groups-list/groups-list.component.html`

(Locate the row template and the action buttons; if the file has multiple tables, e.g. goods + goodsTypes, apply to both with `row-goods-type-{id}`.)

- [ ] **Step 6: Admin forms (CRUD)**

For every `*-detail` form component (user, place, goods, goods-type, currency, group), add:
- input controls → `data-testid="form-<field>"` matching the form control name (e.g. `form-name`, `form-email`, `form-price`, `form-color`, `form-icon`)
- save/submit button → `data-testid="form-submit"`
- cancel button → `data-testid="form-cancel"`
- delete button (if present) → `data-testid="form-delete"`

Files:
- `src/app/modules/admin/modules/users/components/user-detail/user-detail.component.html`
- `src/app/modules/admin/modules/users/components/change-password/change-password.component.html`
- `src/app/modules/admin/modules/places/components/place-detail/place-detail.component.html`
- `src/app/modules/admin/modules/goods/components/goods-detail/goods-detail.component.html`
- `src/app/modules/admin/modules/goods/components/goods-type-detail/goods-type-detail.component.html`
- `src/app/modules/admin/modules/currencies/components/currency-detail/currency-detail.component.html`
- `src/app/modules/groups/components/group-detail/group-detail.component.html`

- [ ] **Step 7: POS (Sale module)**

Modify `src/app/modules/sale/components/sale-summary/sale-summary.component.html`:
- total display → `data-testid="sale-summary-total"`
- "total left" display → `data-testid="sale-summary-total-left"`
- submit button → `data-testid="sale-submit"`
- clear/empty button → `data-testid="sale-clear"`
- overdraft warning element → `data-testid="sale-overdraft-warning"`
- each basket item → `[attr.data-testid]="'basket-item-' + item.goodsId"`
- remove button in basket → `data-testid="basket-item-remove"`

Modify `src/app/modules/sale/components/filter-panel/filter-panel.component.html`:
- each filter chip/button → `[attr.data-testid]="'filter-panel-' + type.id"`

Modify `src/app/modules/sale/components/sale-item/sale-item.component.html`:
- root element → `[attr.data-testid]="'goods-tile-' + item.id"`

- [ ] **Step 8: Dialogs**

Modify dialogs:
- `src/app/common/components/confirm-dialog/confirm-dialog.component.html` — yes button `confirm-yes`, no button `confirm-no`
- `src/app/modules/sale/components/charge-dialog/charge-dialog.component.html` (and `discharge-dialog`) — amount input `charge-amount` / `discharge-amount`, submit `charge-submit` / `discharge-submit`
- `src/app/modules/sale/components/storno-dialog/storno-dialog.component.html` — confirm button `storno-confirm`
- `src/app/modules/admin/modules/users/components/assign-card-dialog/assign-card-dialog.component.html` — submit `assign-card-submit`

- [ ] **Step 9: Card-info, Check-in, Place-select**

Modify `src/app/modules/card-info/components/card-info/card-info.component.html`:
- balance → `card-info-balance`
- QR code wrapper → `card-info-qr`
- each group chip → `[attr.data-testid]="'card-info-group-' + group.id"`

Modify `src/app/modules/check-in/check-in.component.html`:
- member-id input → `checkin-member-id`
- name input → `checkin-name`
- email input → `checkin-email`
- group picker → `checkin-group`
- submit → `checkin-submit`

Modify `src/app/modules/place-select/place-select.component.html`:
- each place option → `[attr.data-testid]="'place-option-' + place.id"`

- [ ] **Step 10: Transactions**

Modify `src/app/modules/admin/modules/transactions/components/transactions/transactions.component.html`:
- each tab/header → `tx-tab-all`, `tx-tab-place`, `tx-tab-user`

Modify `src/app/modules/admin/modules/transactions/components/transactions-list/transactions-list.component.html`:
- each row → `[attr.data-testid]="'tx-row-' + tx.id"`
- storno button → `data-testid="tx-row-storno-btn"`

Find the date filter inputs in transactions (likely in transactions component or its filter sub-component) → `tx-filter-from`, `tx-filter-to`.

- [ ] **Step 11: Snackbars (AlertService)**

Locate the snackbar template configuration in `src/app/common/services/alert/alert.service.ts`. If it uses MatSnackBar with default config, configure `panelClass` so the snackbar wrapper gets a class we can locate, OR use a custom snackbar component with explicit testid.

Check current implementation:

```bash
grep -n "panelClass\|openFromComponent\|open(" src/app/common/services/alert/alert.service.ts
```

If it uses `snackBar.open(msg, ...)`, modify `success`, `error`, `info` methods to add a `panelClass`:

```typescript
public success(msg: string): void {
  this.snackBar.open(msg, undefined, { panelClass: ['alert-success'], duration: 3000 });
}
public error(msg: string): void {
  this.snackBar.open(msg, undefined, { panelClass: ['alert-error'], duration: 5000 });
}
public info(msg: string): void {
  this.snackBar.open(msg, undefined, { panelClass: ['alert-info'], duration: 3000 });
}
```

Tests will locate alerts via `page.locator('.mat-mdc-snack-bar-container.alert-success')`.

- [ ] **Step 12: Verify build still works**

```bash
npx ng build --configuration=development
```

Expected: build succeeds. No new TypeScript or template errors.

- [ ] **Step 13: Commit**

```bash
git add src/
git commit -m "feat: add data-testid attributes for E2E selectors"
```

---

### Task 3: Extend `CardLoaderComponent` with debug user-select dropdown

The component already shows debug controls when `authService.isDebug`. Add an additive dropdown listing **all** users with cards. Original first-3 buttons stay. This is gated by the same `@if` block — production UX unaffected.

**Files:**
- Modify: `src/app/common/components/card-loader/card-loader.component.ts`
- Modify: `src/app/common/components/card-loader/card-loader.component.html`
- Modify: `src/app/common/components/card-loader/card-loader.component.spec.ts`

- [ ] **Step 1: Update spec test first (TDD)**

Open `card-loader.component.spec.ts`. Add a test that asserts the dropdown is rendered when `isDebug=true` and emits `cardIdChange` with the selected card UID:

```typescript
it('renders debug user-select dropdown when isDebug=true and emits cardIdChange on select', async () => {
  // Arrange: stub UsersService and CardsService
  const mockCards = {
    data: [
      { uid: 1111111111, userId: 1 },
      { uid: 2222222222, userId: 2 },
      { uid: 3333333333, userId: 3 },
    ],
  };
  const mockUsers: Record<number, IUser> = {
    1: { id: 1, name: 'Alice',   email: 'a@x', memberId: 1, roles: [], blocked: false },
    2: { id: 2, name: 'Bob',     email: 'b@x', memberId: 2, roles: [], blocked: false },
    3: { id: 3, name: 'Charlie', email: 'c@x', memberId: 3, roles: [], blocked: false },
  };

  // re-create component under TestBed with isDebug=true
  // (existing TestBed in this spec uses isDebug=false; create a new describe block with isDebug=true)

  // After component init:
  fixture.detectChanges();
  await fixture.whenStable();

  const select = fixture.debugElement.query(By.css('[data-testid="card-loader-debug-user-select"]'));
  expect(select).toBeTruthy();

  spyOn(component.cardIdChange, 'emit');
  component.selectDebugUser(2222222222);
  expect(component.cardIdChange.emit).toHaveBeenCalledWith(2222222222);
});
```

(Adjust mocks to follow the existing spec's pattern — see `card-loader.component.spec.ts` for the existing test structure, mirror it.)

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx ng test --watch=false --include='**/card-loader.component.spec.ts'
```

Expected: FAIL — `selectDebugUser` undefined or `card-loader-debug-user-select` not found.

- [ ] **Step 3: Update the component TypeScript**

Open `card-loader.component.ts`. Add a public method and expose all card↔user pairs (not just first 3):

Modify the existing init code that builds `userCards`. Currently it only takes 3 unique users. Replace the `slice(0, 3)` with a separate field `allUserCards`:

```typescript
protected userCards: Record<string, number> = {};       // existing — first 3 (kept for back-compat)
protected allUserCards: { name: string; uid: number }[] = []; // new — all users with cards

public async ngOnInit(): Promise<void> {
  this.customerService.customer$
    .pipe(takeUntil(this.unsubscribe))
    .subscribe((user) => {
      if(user === null) {
        this.initCardListener();
      }
    });

  if(this.authService.isDebug) {
    const cards = (await this.cardsService.getCards(0, 100)).data
      .filter(c => c.uid !== undefined && c.userId !== undefined);

    const allUniqueUserIds = [...new Set(cards.map(c => c.userId!))];
    const users = Utils.toHashMap(
      await Promise.all(allUniqueUserIds.map(id => this.usersService.getUser(id))),
      'id'
    ) as Record<number, IUser>;

    // existing field — keep first 3 for the original buttons
    const firstThreeIds = allUniqueUserIds.slice(0, 3);
    for(const card of cards) {
      if(card.userId !== undefined && card.uid && users[card.userId] && firstThreeIds.includes(card.userId)) {
        this.userCards[users[card.userId].name] = card.uid;
      }
    }

    // new field — full list for the debug dropdown
    this.allUserCards = cards
      .filter(c => users[c.userId!])
      .map(c => ({ name: users[c.userId!].name, uid: c.uid! }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

public selectDebugUser(uid: number): void {
  if (uid != null) {
    this.cardIdChange.emit(uid);
  }
}
```

Add `MatFormFieldModule` and `MatSelectModule` to the component's `imports`:

```typescript
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-card-loader',
    templateUrl: './card-loader.component.html',
    styleUrls: ['./card-loader.component.scss'],
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule,
              MatFormFieldModule, MatSelectModule, FormsModule]
})
```

Add `import { FormsModule } from '@angular/forms';` at the top.

- [ ] **Step 4: Update the template**

Open `card-loader.component.html`. Inside the `@if (authService.isLogged && authService.isDebug)` block, AFTER the existing buttons section, add:

```html
<h5 class="mt-4 mb-2">Vyber uživatele (E2E)</h5>
<mat-form-field appearance="outline" class="w-100">
  <mat-label>Uživatel</mat-label>
  <mat-select
    data-testid="card-loader-debug-user-select"
    (selectionChange)="selectDebugUser($event.value)">
    @for (entry of allUserCards; track entry.uid) {
      <mat-option [value]="entry.uid">{{ entry.name }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

- [ ] **Step 5: Run the spec to confirm it passes**

```bash
npx ng test --watch=false --include='**/card-loader.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Run full unit suite to catch regressions**

```bash
npx ng test --watch=false
```

Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/app/common/components/card-loader/
git commit -m "feat(card-loader): add debug user-select dropdown for E2E tests"
```

---

### Task 4: Create fixture data — users

**Files:**
- Create: `e2e/fixtures/data/users.ts`

- [ ] **Step 1: Write the file**

```typescript
import { IUser, EUserRole } from '../../../src/app/common/types/IUser';

export type FixtureUser = IUser & { id: number; password: string };

export const users: FixtureUser[] = [
  { id: 1, name: 'Admin Adminský',     email: 'admin@test.cz',   password: 'admin123',
    memberId: 1001, roles: [EUserRole.ADMIN],          blocked: false },
  { id: 2, name: 'Pavel Pokladní',     email: 'worker@test.cz',  password: 'worker123',
    memberId: 1002, roles: [EUserRole.WORKER],         blocked: false },
  { id: 3, name: 'Petr PowerSales',    email: 'power@test.cz',   password: 'power123',
    memberId: 1003, roles: [EUserRole.POWER_SALESMAN], blocked: false },
  { id: 4, name: 'Marie Členka',       email: 'member@test.cz',  password: 'member123',
    memberId: 1004, roles: [EUserRole.MEMBER],         blocked: false, groups: [1] },
  { id: 5, name: 'Jana Zákaznice',     email: 'jana@test.cz',    password: 'jana123',
    memberId: 1005, roles: [EUserRole.MEMBER],         blocked: false, groups: [1, 2] },
  { id: 6, name: 'Karel Zablokovaný',  email: 'karel@test.cz',   password: 'karel123',
    memberId: 1006, roles: [EUserRole.MEMBER],         blocked: true },
  { id: 7, name: 'Tomáš Tučný',        email: 'tomas@test.cz',   password: 'pwd123',
    memberId: 1007, roles: [EUserRole.MEMBER],         blocked: false },
  { id: 8, name: 'Lucie Lišková',      email: 'lucie@test.cz',   password: 'pwd123',
    memberId: 1008, roles: [EUserRole.MEMBER],         blocked: false, groups: [2] },
  { id: 9, name: 'Ondřej Otec',        email: 'ondrej@test.cz',  password: 'pwd123',
    memberId: 1009, roles: [EUserRole.MEMBER],         blocked: false, groups: [3] },
  { id: 10, name: 'Eva Eko',           email: 'eva@test.cz',     password: 'pwd123',
    memberId: 1010, roles: [EUserRole.MEMBER],         blocked: false },
];

export const adminUser   = users[0];
export const workerUser  = users[1];
export const powerUser   = users[2];
export const memberUser  = users[3];
export const janaUser    = users[4];   // overdraft scenario
export const blockedUser = users[5];
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
```

Expected: no errors. (If `IUser` import path is wrong, fix it — verify in `src/app/common/types/`.)

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures/data/users.ts
git commit -m "feat(e2e): add user fixtures"
```

---

### Task 5: Create fixture data — places, goods-types, goods, currencies, currency-accounts, cards, groups, user-groups, transactions

These are independent files following the same pattern. Create each, type-check, commit at the end.

**Files:**
- Create: `e2e/fixtures/data/places.ts`
- Create: `e2e/fixtures/data/goods-types.ts`
- Create: `e2e/fixtures/data/goods.ts`
- Create: `e2e/fixtures/data/currencies.ts`
- Create: `e2e/fixtures/data/currency-accounts.ts`
- Create: `e2e/fixtures/data/cards.ts`
- Create: `e2e/fixtures/data/groups.ts`
- Create: `e2e/fixtures/data/user-groups.ts`
- Create: `e2e/fixtures/data/transactions.ts`
- Create: `e2e/fixtures/data/index.ts`

- [ ] **Step 1: `places.ts`**

```typescript
import { IPlace, EPlaceRole } from '../../../src/app/common/types/IPlace';

export const places: (IPlace & { id: number })[] = [
  { id: 1, name: 'Hlavní bar',     type: EPlaceRole.BAR,          apiToken: 'token-bar-1' },
  { id: 2, name: 'Vedlejší bar',   type: EPlaceRole.BAR,          apiToken: 'token-bar-2' },
  { id: 3, name: 'Registrace',     type: EPlaceRole.REGISTRATION, apiToken: 'token-reg-1' },
];

export const place1 = places[0];
export const place2 = places[1];
export const placeRegistration = places[2];
```

- [ ] **Step 2: `goods-types.ts`**

```typescript
import { IGoodsType } from '../../../src/app/common/types/IGoodsType';

export const goodsTypes: (IGoodsType & { id: number })[] = [
  { id: 1, name: 'Nápoje',  icon: 'local_bar',     deleted: false },
  { id: 2, name: 'Jídlo',   icon: 'restaurant',    deleted: false },
  { id: 3, name: 'Merch',   icon: 'shopping_bag',  deleted: false },
  { id: 4, name: 'Služby',  icon: 'room_service',  deleted: false },
];
```

- [ ] **Step 3: `goods.ts`**

```typescript
import { IGoods } from '../../../src/app/common/types/IGoods';

export const goods: (IGoods & { id: number })[] = [
  // place 1 (Hlavní bar) — sortiment
  { id: 1,  goodsTypeId: 1, name: 'Pivo 0,5l',   price: 50,  currencyId: 1, placeId: 1, deleted: false },
  { id: 2,  goodsTypeId: 1, name: 'Víno 0,2l',   price: 60,  currencyId: 1, placeId: 1, deleted: false },
  { id: 3,  goodsTypeId: 1, name: 'Voda',        price: 25,  currencyId: 1, placeId: 1, deleted: false },
  { id: 4,  goodsTypeId: 2, name: 'Klobása',     price: 80,  currencyId: 1, placeId: 1, deleted: false },
  { id: 5,  goodsTypeId: 2, name: 'Hranolky',    price: 60,  currencyId: 1, placeId: 1, deleted: false },
  { id: 6,  goodsTypeId: 1, name: 'Káva',        price: 40,  currencyId: 1, placeId: 1, deleted: false },
  { id: 7,  goodsTypeId: 3, name: 'Tričko',      price: 350, currencyId: 1, placeId: 1, deleted: false },
  { id: 8,  goodsTypeId: 4, name: 'Šatna',       price: 30,  currencyId: 1, placeId: 1, deleted: false },
  // place 2 (Vedlejší bar) — overlap pro move test
  { id: 9,  goodsTypeId: 1, name: 'Pivo 0,3l',   price: 35,  currencyId: 1, placeId: 2, deleted: false },
  { id: 10, goodsTypeId: 1, name: 'Limonáda',    price: 30,  currencyId: 1, placeId: 2, deleted: false },
  { id: 11, goodsTypeId: 2, name: 'Bagel',       price: 70,  currencyId: 1, placeId: 2, deleted: false },
  { id: 12, goodsTypeId: 3, name: 'Náramek',     price: 100, currencyId: 1, placeId: 2, deleted: false },
];
```

- [ ] **Step 4: `currencies.ts`**

```typescript
import { ICurrency } from '../../../src/app/common/types/ICurrency';

export const currencies: (ICurrency & { id: number })[] = [
  { id: 1, name: 'Koruna festivalu', code: 'KRF', symbol: 'Kč',
    minRechargeAmountWarn: 100, maxRechargeAmountWarn: 5000, blocked: false },
  { id: 2, name: 'BlockedCoin',      code: 'BLK', symbol: '₿',
    minRechargeAmountWarn: 0,   maxRechargeAmountWarn: 0,    blocked: true },
];

export const defaultCurrency = currencies[0];
export const blockedCurrency = currencies[1];
```

- [ ] **Step 5: `currency-accounts.ts`**

```typescript
import { ICurrencyAccount } from '../../../src/app/common/types/ICurrencyAccount';

export const currencyAccounts: ICurrencyAccount[] = [
  { id: 1,  userId: 1,  currencyId: 1, currentAmount: 1000, overdraftLimit: 0   },
  { id: 2,  userId: 2,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
  { id: 3,  userId: 3,  currencyId: 1, currentAmount: 500,  overdraftLimit: 0   },
  { id: 4,  userId: 4,  currencyId: 1, currentAmount: 500,  overdraftLimit: 0   },
  // Jana — overdraft scenario: positive balance 50, allows up to -100
  { id: 5,  userId: 5,  currencyId: 1, currentAmount: 50,   overdraftLimit: 100 },
  { id: 6,  userId: 6,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
  { id: 7,  userId: 7,  currencyId: 1, currentAmount: 200,  overdraftLimit: 0   },
  { id: 8,  userId: 8,  currencyId: 1, currentAmount: 750,  overdraftLimit: 0   },
  { id: 9,  userId: 9,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
  { id: 10, userId: 10, currencyId: 1, currentAmount: 100,  overdraftLimit: 0   },
];
```

- [ ] **Step 6: `cards.ts`**

```typescript
export interface FixtureCard { id: number; uid: number; userId: number; }

export const cards: FixtureCard[] = [
  { id: 1,  uid: 1111111111, userId: 4 },  // Marie
  { id: 2,  uid: 2222222222, userId: 5 },  // Jana
  { id: 3,  uid: 3333333333, userId: 3 },  // PowerSales
  { id: 4,  uid: 4444444444, userId: 7 },  // Tomáš
  { id: 5,  uid: 5555555555, userId: 8 },  // Lucie
  { id: 6,  uid: 6666666666, userId: 9 },  // Ondřej
  { id: 7,  uid: 7777777777, userId: 10 }, // Eva
  { id: 8,  uid: 8888888888, userId: 1 },  // Admin
];

export const marieCard = cards[0];
export const janaCard  = cards[1];
```

- [ ] **Step 7: `groups.ts`**

```typescript
import { IGroup } from '../../../src/app/modules/groups/types/IGroup';

export const groups: IGroup[] = [
  { id: 1, name: 'VIP',         color: '#ff0000' },
  { id: 2, name: 'Staff',       color: '#00ff00' },
  { id: 3, name: 'Návštěvníci', color: '#0000ff' },
];
```

- [ ] **Step 8: `user-groups.ts`**

```typescript
export interface FixtureUserGroup { userId: number; groupId: number; }

export const userGroups: FixtureUserGroup[] = [
  { userId: 4, groupId: 1 },
  { userId: 5, groupId: 1 },
  { userId: 5, groupId: 2 },
  { userId: 8, groupId: 2 },
  { userId: 9, groupId: 3 },
];
```

- [ ] **Step 9: `transactions.ts`**

```typescript
import { ITransaction } from '../../../src/app/common/types/ITransaction';

const dayMs = 86_400_000;
const now = Date.parse('2026-04-26T12:00:00Z');
const daysAgo = (n: number) => new Date(now - n * dayMs).toISOString();

export const transactions: (ITransaction & { id: number })[] = [
  // Recent transactions for users 4, 5, 7
  { id: 1,  userId: 4, placeId: 1, amount: -50,  currencyId: 1, createdAt: daysAgo(1)  } as any,
  { id: 2,  userId: 4, placeId: 1, amount: -80,  currencyId: 1, createdAt: daysAgo(1)  } as any,
  { id: 3,  userId: 5, placeId: 1, amount: -30,  currencyId: 1, createdAt: daysAgo(2)  } as any,
  { id: 4,  userId: 5, placeId: 2, amount: -70,  currencyId: 1, createdAt: daysAgo(3)  } as any,
  { id: 5,  userId: 7, placeId: 1, amount: -100, currencyId: 1, createdAt: daysAgo(5)  } as any,
  { id: 6,  userId: 4, placeId: 1, amount: 500,  currencyId: 1, createdAt: daysAgo(7)  } as any, // top-up
  { id: 7,  userId: 5, placeId: 3, amount: 200,  currencyId: 1, createdAt: daysAgo(14) } as any,
  { id: 8,  userId: 8, placeId: 2, amount: -60,  currencyId: 1, createdAt: daysAgo(15) } as any,
  { id: 9,  userId: 8, placeId: 1, amount: -50,  currencyId: 1, createdAt: daysAgo(20) } as any,
  { id: 10, userId: 7, placeId: 2, amount: -35,  currencyId: 1, createdAt: daysAgo(25) } as any,
  { id: 11, userId: 4, placeId: 2, amount: -100, currencyId: 1, createdAt: daysAgo(30) } as any,
  { id: 12, userId: 5, placeId: 1, amount: -25,  currencyId: 1, createdAt: daysAgo(35) } as any,
  { id: 13, userId: 9, placeId: 1, amount: -80,  currencyId: 1, createdAt: daysAgo(40) } as any,
  { id: 14, userId: 10, placeId: 1, amount: 100, currencyId: 1, createdAt: daysAgo(45) } as any,
  { id: 15, userId: 10, placeId: 1, amount: -25, currencyId: 1, createdAt: daysAgo(50) } as any,
  { id: 16, userId: 8, placeId: 2, amount: -90,  currencyId: 1, createdAt: daysAgo(60) } as any,
  { id: 17, userId: 4, placeId: 1, amount: -40,  currencyId: 1, createdAt: daysAgo(70) } as any,
  { id: 18, userId: 7, placeId: 1, amount: -50,  currencyId: 1, createdAt: daysAgo(80) } as any,
  { id: 19, userId: 5, placeId: 1, amount: -30,  currencyId: 1, createdAt: daysAgo(85) } as any,
  { id: 20, userId: 9, placeId: 2, amount: -70,  currencyId: 1, createdAt: daysAgo(88) } as any,
  // ... (10 more for pagination — repeat pattern, varying users/days)
  { id: 21, userId: 4, placeId: 1, amount: -25,  currencyId: 1, createdAt: daysAgo(2)  } as any,
  { id: 22, userId: 5, placeId: 1, amount: -40,  currencyId: 1, createdAt: daysAgo(4)  } as any,
  { id: 23, userId: 7, placeId: 1, amount: -55,  currencyId: 1, createdAt: daysAgo(6)  } as any,
  { id: 24, userId: 8, placeId: 1, amount: -65,  currencyId: 1, createdAt: daysAgo(8)  } as any,
  { id: 25, userId: 9, placeId: 1, amount: -75,  currencyId: 1, createdAt: daysAgo(10) } as any,
  { id: 26, userId: 10, placeId: 1, amount: -85, currencyId: 1, createdAt: daysAgo(12) } as any,
  { id: 27, userId: 4, placeId: 2, amount: -45,  currencyId: 1, createdAt: daysAgo(16) } as any,
  { id: 28, userId: 5, placeId: 2, amount: -55,  currencyId: 1, createdAt: daysAgo(18) } as any,
  { id: 29, userId: 7, placeId: 2, amount: -65,  currencyId: 1, createdAt: daysAgo(22) } as any,
  { id: 30, userId: 8, placeId: 2, amount: -75,  currencyId: 1, createdAt: daysAgo(28) } as any,
];
```

NOTE: Final shape of `ITransaction` must be verified — open `src/app/common/types/ITransaction.ts` (or wherever it lives) and adjust field names. The `as any` casts above are placeholders if the real interface differs; replace them with the real fields once verified. **Do not leave `as any` in the committed code** — fix the import and remove the cast.

- [ ] **Step 10: `index.ts` barrel export**

```typescript
export * from './users';
export * from './places';
export * from './goods-types';
export * from './goods';
export * from './currencies';
export * from './currency-accounts';
export * from './cards';
export * from './groups';
export * from './user-groups';
export * from './transactions';
```

- [ ] **Step 11: Type-check**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
```

Expected: no errors. Fix import paths and any field mismatches with real types.

- [ ] **Step 12: Commit**

```bash
git add e2e/fixtures/data/
git commit -m "feat(e2e): add fixture data (places, goods, currencies, accounts, cards, groups, transactions)"
```

---

### Task 6: JWT helper

**Files:**
- Create: `e2e/fixtures/jwt.ts`

- [ ] **Step 1: Write the helper**

```typescript
import type { EUserRole } from '../../src/app/common/types/IUser';

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  roles: EUserRole[];
  exp: number;
}

export function createMockJwt(payload: JwtPayload): string {
  const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  return `${header}.${body}.signature`;
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/fixtures/jwt.ts
git commit -m "feat(e2e): add createMockJwt helper"
```

---

### Task 7: Selectors and message constants

**Files:**
- Create: `e2e/support/selectors.ts`
- Create: `e2e/support/messages.ts`

- [ ] **Step 1: `selectors.ts`**

```typescript
export const SEL = {
  login: {
    email: 'login-email',
    password: 'login-password',
    submit: 'login-submit',
    error: 'login-error',
  },
  nav: {
    sale: 'nav-sale',
    adminUsers: 'nav-admin-users',
    adminPlaces: 'nav-admin-places',
    adminGoods: 'nav-admin-goods',
    adminCurrencies: 'nav-admin-currencies',
    adminTransactions: 'nav-admin-transactions',
    adminCharge: 'nav-admin-charge',
    adminGroups: 'nav-admin-groups',
    checkIn: 'nav-check-in',
    cardInfo: 'nav-card-info',
    logout: 'nav-logout',
    debugToggle: 'nav-debug-toggle',
  },
  topMenu: {
    balance: 'top-menu-balance',
    place: 'top-menu-place',
  },
  cardLoader: {
    userSelect: 'card-loader-debug-user-select',
    newCard: 'card-loader-debug-new-card',
  },
  form: {
    submit: 'form-submit',
    cancel: 'form-cancel',
    delete: 'form-delete',
    name: 'form-name',
    email: 'form-email',
    price: 'form-price',
    color: 'form-color',
    icon: 'form-icon',
  },
  pos: {
    total: 'sale-summary-total',
    totalLeft: 'sale-summary-total-left',
    submit: 'sale-submit',
    clear: 'sale-clear',
    overdraft: 'sale-overdraft-warning',
    basketRemove: 'basket-item-remove',
    goodsTile: (id: number) => `goods-tile-${id}`,
    basketItem: (id: number) => `basket-item-${id}`,
    filter: (typeId: number) => `filter-panel-${typeId}`,
  },
  dialog: {
    confirmYes: 'confirm-yes',
    confirmNo: 'confirm-no',
    chargeAmount: 'charge-amount',
    chargeSubmit: 'charge-submit',
    dischargeAmount: 'discharge-amount',
    dischargeSubmit: 'discharge-submit',
    stornoConfirm: 'storno-confirm',
    assignCardSubmit: 'assign-card-submit',
  },
  cardInfo: {
    balance: 'card-info-balance',
    qr: 'card-info-qr',
    group: (id: number) => `card-info-group-${id}`,
  },
  checkIn: {
    memberId: 'checkin-member-id',
    name: 'checkin-name',
    email: 'checkin-email',
    group: 'checkin-group',
    submit: 'checkin-submit',
  },
  placeSelect: {
    option: (id: number) => `place-option-${id}`,
  },
  tx: {
    tabAll: 'tx-tab-all',
    tabPlace: 'tx-tab-place',
    tabUser: 'tx-tab-user',
    row: (id: number) => `tx-row-${id}`,
    storno: 'tx-row-storno-btn',
    filterFrom: 'tx-filter-from',
    filterTo: 'tx-filter-to',
  },
  row: {
    user: (id: number) => `row-user-${id}`,
    place: (id: number) => `row-place-${id}`,
    goods: (id: number) => `row-goods-${id}`,
    currency: (id: number) => `row-currency-${id}`,
    group: (id: number) => `row-group-${id}`,
    actionEdit: 'row-action-edit',
    actionDelete: 'row-action-delete',
    actionChangePassword: 'row-action-change-password',
  },
} as const;

export const ALERT = {
  success: '.mat-mdc-snack-bar-container.alert-success',
  error: '.mat-mdc-snack-bar-container.alert-error',
  info: '.mat-mdc-snack-bar-container.alert-info',
} as const;
```

- [ ] **Step 2: `messages.ts`**

```typescript
// Czech UI text constants — single place to update on UI text changes.
export const MSG = {
  cardLoader: {
    scanCard: 'Načtěte kartu',
  },
  buttons: {
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    confirm: 'Potvrdit',
    edit: 'Upravit',
    new: 'Nový',
  },
  alerts: {
    saved: 'Uloženo',
    deleted: 'Smazáno',
    error: 'Chyba',
    invalidCredentials: 'Neplatné přihlašovací údaje',
  },
  validation: {
    required: 'Povinné pole',
  },
} as const;
```

These are starter values; adjust during test writing if exact Czech text differs.

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/support/selectors.ts e2e/support/messages.ts
git commit -m "feat(e2e): add selectors and message constants"
```

---

### Task 8: Mock state + router skeleton

**Files:**
- Create: `e2e/fixtures/api-mock.ts`

- [ ] **Step 1: Write the file (state + skeleton)**

```typescript
import { Page, Route } from '@playwright/test';
import {
  users, places, goods, goodsTypes, currencies, currencyAccounts,
  cards, groups, userGroups, transactions, FixtureUser, FixtureCard
} from './data';

export interface MockState {
  users: FixtureUser[];
  places: typeof places;
  goods: typeof goods;
  goodsTypes: typeof goodsTypes;
  currencies: typeof currencies;
  accounts: typeof currencyAccounts;
  cards: FixtureCard[];
  groups: typeof groups;
  userGroups: typeof userGroups;
  transactions: typeof transactions;
  nextId: { user: number; place: number; goods: number; currency: number; group: number; transaction: number; card: number };
}

export function createMockState(): MockState {
  return {
    users:       structuredClone(users)            as FixtureUser[],
    places:      structuredClone(places),
    goods:       structuredClone(goods),
    goodsTypes:  structuredClone(goodsTypes),
    currencies:  structuredClone(currencies),
    accounts:    structuredClone(currencyAccounts),
    cards:       structuredClone(cards)            as FixtureCard[],
    groups:      structuredClone(groups),
    userGroups:  structuredClone(userGroups),
    transactions: structuredClone(transactions),
    nextId: { user: 1000, place: 1000, goods: 1000, currency: 1000, group: 1000, transaction: 10000, card: 1000 },
  };
}

interface HandlerContext {
  url: URL;
  body: any;
  state: MockState;
}

interface HandlerResult { status?: number; body: any; }

type Handler = (ctx: HandlerContext) => HandlerResult | Promise<HandlerResult>;

interface RouteEntry { method: string; pattern: RegExp; handler: Handler; }

const routes: RouteEntry[] = [];

export function on(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method, pattern, handler });
}

function matchRoute(method: string, path: string): { handler: Handler; match: RegExpMatchArray } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.pattern);
    if (m) return { handler: r.handler, match: m };
  }
  return null;
}

function paginated<T>(items: T[], page = 0, pageSize = 50) {
  const start = page * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export async function installApiMock(page: Page, state = createMockState()): Promise<MockState> {
  await page.route('**/api/v1.1/**', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/v1\.1\//, '');

    const matched = matchRoute(req.method(), path);
    if (!matched) {
      console.warn(`[mock] unhandled ${req.method()} ${path}`);
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
    let body: any = undefined;
    try { body = req.postDataJSON(); } catch { body = undefined; }

    try {
      const result = await matched.handler({ url, body, state });
      return route.fulfill({
        status: result.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(result.body),
      });
    } catch (err) {
      console.error(`[mock] handler error ${req.method()} ${path}:`, err);
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    }
  });
  return state;
}

// Helpers exported for handlers
export { paginated };
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/fixtures/api-mock.ts
git commit -m "feat(e2e): add api-mock router skeleton"
```

---

### Task 9: Mock handlers — auth, users, places, goods, currencies, accounts, cards, groups, transactions

This is the bulk of the mock implementation. Endpoints below were extracted from the actual service code (`src/app/modules/**/services/*.service.ts`).

**Files:**
- Create: `e2e/fixtures/api-mock-handlers.ts`
- Modify: `e2e/fixtures/api-mock.ts` (import handlers so `on(...)` calls register)

- [ ] **Step 1: Write `api-mock-handlers.ts`**

```typescript
import { on, paginated, MockState } from './api-mock';
import { createMockJwt } from './jwt';

// Pagination params: services pass page=0..N, pageSize=50 typically.
function pageParams(url: URL) {
  return {
    page: Number(url.searchParams.get('page') ?? 0),
    pageSize: Number(url.searchParams.get('pageSize') ?? 50),
  };
}

// AUTH
on('POST', /^authentication\/user\/email$/, ({ body, state }) => {
  const u = state.users.find(x => x.email === body?.email && x.password === body?.password);
  if (!u) return { status: 401, body: { error: 'invalid credentials' } };
  if (u.blocked) return { status: 403, body: { error: 'blocked' } };
  const token = createMockJwt({
    sub: String(u.id), name: u.name, email: u.email, roles: u.roles,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  return { body: { token } };
});

// USERS
on('GET', /^users$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.users, page, pageSize) };
});
on('GET', /^users\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const u = state.users.find(x => x.id === id);
  return u ? { body: u } : { status: 404, body: { error: 'not found' } };
});
on('POST', /^users$/, ({ body, state }) => {
  const id = ++state.nextId.user;
  const u = { ...body, id };
  state.users.push(u);
  return { body: u };
});
on('PUT', /^users\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.users.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.users[i] = { ...state.users[i], ...body, id };
  return { body: state.users[i] };
});
on('DELETE', /^users\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.users = state.users.filter(x => x.id !== id);
  return { body: {} };
});
on('PUT', /^users\/(\d+)\/roles$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const u = state.users.find(x => x.id === id);
  if (u) u.roles = body.roles;
  return { body: { roles: body.roles } };
});
on('PUT', /^users\/(\d+)\/changepassword$/, () => ({ body: {} }));

// USER → cards / transactions / accounts / card-assign
on('GET', /^users\/(\d+)\/cards$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const list = state.cards.filter(c => c.userId === id);
  const { page, pageSize } = pageParams(url);
  return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)\/transactions$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const list = state.transactions.filter((t: any) => t.userId === id);
  const { page, pageSize } = pageParams(url);
  return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)\/accounts$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const list = state.accounts.filter(a => a.userId === id);
  const { page, pageSize } = pageParams(url);
  return { body: paginated(list, page, pageSize) };
});
on('POST', /^users\/(\d+)\/card$/, ({ url, body, state }) => {
  const userId = Number(url.pathname.split('/')[1]);
  const id = ++state.nextId.card;
  const card = { id, uid: body?.uid ?? Math.floor(Math.random() * 1e10), userId };
  state.cards.push(card);
  return { body: card };
});

// CARDS
on('GET', /^cards$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.cards, page, pageSize) };
});
on('GET', /^cards\/(\d+)\/user$/, ({ url, state }) => {
  const uid = Number(url.pathname.split('/')[1]);
  const c = state.cards.find(x => x.uid === uid);
  if (!c) return { status: 404, body: {} };
  const u = state.users.find(x => x.id === c.userId);
  return u ? { body: u } : { status: 404, body: {} };
});
on('DELETE', /^cards\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.cards = state.cards.filter(x => x.id !== id);
  return { body: {} };
});

// PLACES
on('GET', /^places$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.places, page, pageSize) };
});
on('GET', /^places\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const p = state.places.find(x => x.id === id);
  return p ? { body: p } : { status: 404, body: {} };
});
on('GET', /^places\/(\d+)\/roles$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const p = state.places.find(x => x.id === id);
  return { body: { roles: p?.type ? [p.type] : [] } };
});
on('GET', /^places\/(\d+)\/goods$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const list = state.goods.filter(g => g.placeId === id);
  const { page, pageSize } = pageParams(url);
  return { body: paginated(list, page, pageSize) };
});
on('GET', /^places\/(\d+)\/transactions$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const list = state.transactions.filter((t: any) => t.placeId === id);
  const { page, pageSize } = pageParams(url);
  return { body: paginated(list, page, pageSize) };
});
on('POST', /^places\/?$/, ({ body, state }) => {
  const id = ++state.nextId.place;
  const p = { ...body, id };
  state.places.push(p);
  return { body: p };
});
on('PUT', /^places\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.places.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.places[i] = { ...state.places[i], ...body, id };
  return { body: state.places[i] };
});
on('PUT', /^places\/(\d+)\/roles$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const p = state.places.find(x => x.id === id);
  if (p) p.type = body.roles?.[0];
  return { body: { roles: body.roles } };
});
on('DELETE', /^places\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.places = state.places.filter(x => x.id !== id);
  return { body: {} };
});
on('POST', /^places\/(\d+)\/goods/, ({ url, state }) => {
  const placeId = Number(url.pathname.split('/')[1]);
  const goodsId = Number(url.searchParams.get('goodsId'));
  const g = state.goods.find(x => x.id === goodsId);
  if (g) g.placeId = placeId;
  return { body: {} };
});
on('DELETE', /^places\/(\d+)\/goods\/(\d+)$/, ({ url, state }) => {
  const goodsId = Number(url.pathname.split('/').pop());
  const g = state.goods.find(x => x.id === goodsId);
  if (g) g.placeId = null;
  return { body: {} };
});

// GOODS + GOODS TYPES
on('GET', /^goods$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.goods, page, pageSize) };
});
on('GET', /^goods\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const g = state.goods.find(x => x.id === id);
  return g ? { body: g } : { status: 404, body: {} };
});
on('POST', /^goods$/, ({ body, state }) => {
  const id = ++state.nextId.goods;
  const g = { ...body, id };
  state.goods.push(g);
  return { body: g };
});
on('PUT', /^goods\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.goods.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.goods[i] = { ...state.goods[i], ...body, id };
  return { body: state.goods[i] };
});
on('DELETE', /^goods\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.goods = state.goods.filter(x => x.id !== id);
  return { body: {} };
});
on('GET', /^goodstypes$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.goodsTypes, page, pageSize) };
});
on('GET', /^goodstypes\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const t = state.goodsTypes.find(x => x.id === id);
  return t ? { body: t } : { status: 404, body: {} };
});
on('POST', /^goodstypes$/, ({ body, state }) => {
  const id = ++state.nextId.goods;
  const t = { ...body, id };
  state.goodsTypes.push(t);
  return { body: t };
});
on('PUT', /^goodstypes\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.goodsTypes.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.goodsTypes[i] = { ...state.goodsTypes[i], ...body, id };
  return { body: state.goodsTypes[i] };
});
on('DELETE', /^goodstypes\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.goodsTypes = state.goodsTypes.filter(x => x.id !== id);
  return { body: {} };
});

// CURRENCIES
on('GET', /^currencies$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.currencies, page, pageSize) };
});
on('GET', /^currencies\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const c = state.currencies.find(x => x.id === id);
  return c ? { body: c } : { status: 404, body: {} };
});
on('POST', /^currencies$/, ({ body, state }) => {
  const id = ++state.nextId.currency;
  const c = { ...body, id };
  state.currencies.push(c);
  return { body: c };
});
on('PUT', /^currencies\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.currencies.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.currencies[i] = { ...state.currencies[i], ...body, id };
  return { body: state.currencies[i] };
});

// CURRENCY ACCOUNTS
on('GET', /^currencyaccounts\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const a = state.accounts.find(x => x.id === id);
  return a ? { body: a } : { status: 404, body: {} };
});
on('PUT', /^currencyaccounts\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const a = state.accounts.find(x => x.id === id);
  if (a) Object.assign(a, body);
  return { body: a ?? {} };
});

// TRANSACTIONS
on('GET', /^transactions$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.transactions, page, pageSize) };
});
on('GET', /^transactions\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const t = state.transactions.find(x => x.id === id);
  return t ? { body: t } : { status: 404, body: {} };
});
on('POST', /^transactions\/payment$/, ({ body, state }) => {
  // body: { userId, items: [{ goodsId, amount, ... }], placeId, ... }
  const id = ++state.nextId.transaction;
  const total = (body?.items ?? []).reduce((s: number, i: any) => s + (i.price ?? 0) * (i.amount ?? 1), 0);
  const acc = state.accounts.find(a => a.userId === body?.userId);
  if (acc) acc.currentAmount -= total;
  const tx: any = { id, userId: body?.userId, placeId: body?.placeId, amount: -total, currencyId: 1, createdAt: new Date().toISOString() };
  state.transactions.unshift(tx);
  return { body: tx };
});
on('POST', /^transactions\/deposit$/, ({ body, state }) => {
  const id = ++state.nextId.transaction;
  const amt = Number(body?.amount ?? 0);
  const acc = state.accounts.find(a => a.userId === body?.userId);
  if (acc) acc.currentAmount += amt;
  const tx: any = { id, userId: body?.userId, placeId: body?.placeId, amount: amt, currencyId: 1, createdAt: new Date().toISOString() };
  state.transactions.unshift(tx);
  return { body: tx };
});
on('POST', /^transactions\/withDraw$/, ({ body, state }) => {
  const id = ++state.nextId.transaction;
  const amt = Number(body?.amount ?? 0);
  const acc = state.accounts.find(a => a.userId === body?.userId);
  if (acc) acc.currentAmount -= amt;
  const tx: any = { id, userId: body?.userId, placeId: body?.placeId, amount: -amt, currencyId: 1, createdAt: new Date().toISOString() };
  state.transactions.unshift(tx);
  return { body: tx };
});
on('PUT', /^transactions\/(\d+)\/cancellation$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/')[1]);
  const tx: any = state.transactions.find(t => t.id === id);
  if (!tx) return { status: 404, body: {} };
  // reverse balance
  const acc = state.accounts.find(a => a.userId === tx.userId);
  if (acc) acc.currentAmount -= tx.amount; // negate
  tx.cancelled = true;
  return { body: tx };
});

// STATISTICS
on('GET', /^statistics\/(\d+)\/goods$/, ({ state }) => ({ body: { items: [] } }));
on('GET', /^statistics\/(\d+)\/groups-statistics$/, ({ state }) => ({ body: state.groups.map(g => ({ group: g, items: [] })) }));

// GROUPS
on('GET', /^groups$/, ({ url, state }) => {
  const { page, pageSize } = pageParams(url);
  return { body: paginated(state.groups, page, pageSize) };
});
on('GET', /^groups\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const g = state.groups.find(x => x.id === id);
  return g ? { body: g } : { status: 404, body: {} };
});
on('POST', /^groups$/, ({ body, state }) => {
  const id = ++state.nextId.group;
  const g = { ...body, id };
  state.groups.push(g);
  return { body: g };
});
on('PUT', /^groups\/(\d+)$/, ({ url, body, state }) => {
  const id = Number(url.pathname.split('/').pop());
  const i = state.groups.findIndex(x => x.id === id);
  if (i < 0) return { status: 404, body: {} };
  state.groups[i] = { ...state.groups[i], ...body, id };
  return { body: state.groups[i] };
});
on('DELETE', /^groups\/(\d+)$/, ({ url, state }) => {
  const id = Number(url.pathname.split('/').pop());
  state.groups = state.groups.filter(x => x.id !== id);
  return { body: {} };
});
on('POST', /^groups\/(\d+)\/users\/(\d+)$/, ({ url, state }) => {
  const parts = url.pathname.split('/');
  const groupId = Number(parts[1]);
  const userId  = Number(parts[3]);
  state.userGroups.push({ groupId, userId });
  return { body: {} };
});
on('DELETE', /^groups\/(\d+)\/users\/(\d+)$/, ({ url, state }) => {
  const parts = url.pathname.split('/');
  const groupId = Number(parts[1]);
  const userId  = Number(parts[3]);
  state.userGroups = state.userGroups.filter(x => !(x.groupId === groupId && x.userId === userId));
  return { body: {} };
});
```

- [ ] **Step 2: Make `api-mock.ts` import the handlers (so `on(...)` calls register)**

At the bottom of `e2e/fixtures/api-mock.ts`, add:

```typescript
// Side-effect import — registers route handlers via on(...)
import './api-mock-handlers';
```

Move the import to the top per ESLint convention if needed; the call to `installApiMock` must happen after handlers are registered, which the import order ensures.

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/fixtures/api-mock.ts e2e/fixtures/api-mock-handlers.ts
git commit -m "feat(e2e): add API mock handlers (auth, users, places, goods, currencies, transactions, groups)"
```

---

### Task 10: Auth adapter (mock + real)

**Files:**
- Create: `e2e/fixtures/auth-adapter.ts`

- [ ] **Step 1: Write the file**

```typescript
import { Page } from '@playwright/test';
import { createMockJwt } from './jwt';
import { FixtureUser } from './data/users';
import { places } from './data/places';

export const MODE: 'mock' | 'real' = process.env.E2E_MODE === 'real' ? 'real' : 'mock';

export interface AuthAdapter {
  loginAs(page: Page, user: FixtureUser, opts?: { debug?: boolean }): Promise<void>;
  selectPlace(page: Page, placeId: number): Promise<void>;
}

class MockAuthAdapter implements AuthAdapter {
  async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}) {
    const token = createMockJwt({
      sub: String(user.id),
      name: user.name,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await page.addInitScript(([t, debug]: [string, boolean]) => {
      localStorage.setItem('token', t);
      if (debug) localStorage.setItem('isDebug', 'true');
    }, [token, opts.debug ?? true] as const);
  }

  async selectPlace(page: Page, placeId: number) {
    const place = places.find(p => p.id === placeId);
    if (!place) throw new Error(`unknown place ${placeId}`);
    await page.addInitScript((p) => {
      localStorage.setItem('selectedPlace', JSON.stringify(p));
    }, place);
  }
}

class RealAuthAdapter implements AuthAdapter {
  async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}) {
    // Relative URL — Playwright resolves against `use.baseURL` from playwright.config.
    const res = await page.request.post('/api/v1.1/authentication/user/email', {
      data: { email: user.email, password: user.password },
    });
    if (!res.ok()) throw new Error(`real login failed for ${user.email}: ${res.status()}`);
    const json = await res.json();
    const token = json.token ?? json.accessToken ?? json.jwt;
    if (!token) throw new Error(`real login response missing token: ${JSON.stringify(json)}`);
    await page.addInitScript(([t, debug]: [string, boolean]) => {
      localStorage.setItem('token', t);
      if (debug) localStorage.setItem('isDebug', 'true');
    }, [token, opts.debug ?? true] as const);
  }

  async selectPlace(page: Page, placeId: number) {
    // In real mode, navigate via UI. PlaceService persistence detail to be confirmed
    // during test writing; if it persists in localStorage, this can be optimized.
    await page.goto('/place-select');
    await page.getByTestId(`place-option-${placeId}`).click();
  }
}

export const authAdapter: AuthAdapter = MODE === 'real'
  ? new RealAuthAdapter()
  : new MockAuthAdapter();
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/fixtures/auth-adapter.ts
git commit -m "feat(e2e): add MockAuthAdapter / RealAuthAdapter"
```

---

### Task 11: Cleanup helper (real-mode afterEach)

**Files:**
- Create: `e2e/support/cleanup.ts`

- [ ] **Step 1: Write the file**

```typescript
import { Page } from '@playwright/test';
import { MODE } from '../fixtures/auth-adapter';

const E2E_PREFIX = 'e2e-';

/**
 * Removes any entity whose name starts with `e2e-` from the backend.
 * Called after each test in real mode. No-op in mock mode (state is per-test).
 *
 * NOTE: requires the runner to be authenticated as Admin. Tests that need
 * cleanup must be wrapped in the admin persona, OR pass a token explicitly.
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
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/support/cleanup.ts
git commit -m "feat(e2e): add real-mode cleanup helper"
```

---

### Task 12: Personas fixture

**Files:**
- Create: `e2e/support/personas.ts`

- [ ] **Step 1: Write the file**

```typescript
import { test as base, Page } from '@playwright/test';
import { authAdapter, MODE } from '../fixtures/auth-adapter';
import { installApiMock, MockState } from '../fixtures/api-mock';
import { adminUser, workerUser, powerUser, memberUser } from '../fixtures/data/users';
import { place1 } from '../fixtures/data/places';
import { cleanupE2eEntities } from './cleanup';

type Personas = {
  mockState: MockState | null;
  asAdmin: Page;
  asWorker: Page;
  asPowerSalesman: Page;
  asMember: Page;
};

export const test = base.extend<Personas>({
  mockState: async ({ page }, use) => {
    if (MODE === 'mock') {
      const state = await installApiMock(page);
      await use(state);
    } else {
      await use(null);
    }
  },

  asAdmin: async ({ page, mockState }, use) => {
    void mockState; // ensure fixture installed before login
    await authAdapter.loginAs(page, adminUser);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },

  asWorker: async ({ page, mockState }, use) => {
    void mockState;
    await authAdapter.loginAs(page, workerUser);
    await authAdapter.selectPlace(page, place1.id);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },

  asPowerSalesman: async ({ page, mockState }, use) => {
    void mockState;
    await authAdapter.loginAs(page, powerUser);
    await authAdapter.selectPlace(page, place1.id);
    await use(page);
    if (MODE === 'real') await cleanupE2eEntities(page);
  },

  asMember: async ({ page, mockState }, use) => {
    void mockState;
    await authAdapter.loginAs(page, memberUser);
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/support/personas.ts
git commit -m "feat(e2e): add persona fixtures (asAdmin, asWorker, asPowerSalesman, asMember)"
```

---

### Task 13: POS helpers

**Files:**
- Create: `e2e/support/pos.ts`

- [ ] **Step 1: Write the file**

```typescript
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
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit -p e2e/tsconfig.json
git add e2e/support/pos.ts
git commit -m "feat(e2e): add POS helpers (scanCard, scanNewCard, addToBasket, submitOrder)"
```

---

### Task 14: SQL generator

**Files:**
- Create: `e2e/fixtures/sql-generator.ts`
- Create: `e2e/seed/.gitkeep`

- [ ] **Step 1: Write the generator**

```typescript
#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  users, places, goodsTypes, goods, currencies, currencyAccounts,
  cards, groups, userGroups, transactions
} from './data';

type SqlValue = string | number | boolean | null | Date;

function sqlValue(v: SqlValue): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
  // string — escape single quotes
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, rows: Record<string, SqlValue>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const values = rows.map(r => '  (' + cols.map(c => sqlValue(r[c])).join(', ') + ')').join(',\n');
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};\n`;
}

function setSeq(table: string, max: number): string {
  return `SELECT setval('${table}_id_seq', ${max + 1}, false);\n`;
}

const out: string[] = [];

out.push('-- ============================================================');
out.push('-- Generated from e2e/fixtures/data — do not edit by hand.');
out.push('-- Run: npm run e2e:gen-sql');
out.push('--');
out.push('-- ASSUMPTIONS:');
out.push('--   * Postgres dialect');
out.push('--   * snake_case column names (member_id, currency_id, ...)');
out.push('--   * Junction tables: user_roles(user_id, role),');
out.push('--                       user_groups(user_id, group_id)');
out.push('--   * password_hash placeholders contain plaintext for migration to bcrypt');
out.push('-- ============================================================');
out.push('BEGIN;');
out.push('');

// USERS
out.push('-- USERS');
out.push(insert('users', users.map(u => ({
  id: u.id,
  name: u.name,
  email: u.email,
  password_hash: `$2a$10$REPLACE_WITH_BCRYPT_OF_${u.password}`,
  member_id: u.memberId,
  blocked: u.blocked,
}))));
out.push(setSeq('users', Math.max(...users.map(u => u.id))));

// USER_ROLES
out.push('-- USER_ROLES');
const roleRows = users.flatMap(u => u.roles.map(role => ({ user_id: u.id, role })));
out.push(insert('user_roles', roleRows));

// PLACES
out.push('-- PLACES');
out.push(insert('places', places.map(p => ({
  id: p.id, name: p.name, type: p.type ?? null, api_token: p.apiToken ?? null,
}))));
out.push(setSeq('places', Math.max(...places.map(p => p.id))));

// GOODS TYPES
out.push('-- GOODS_TYPES');
out.push(insert('goods_types', goodsTypes.map(t => ({
  id: t.id, name: t.name, icon: t.icon, deleted: t.deleted,
}))));
out.push(setSeq('goods_types', Math.max(...goodsTypes.map(t => t.id))));

// GOODS
out.push('-- GOODS');
out.push(insert('goods', goods.map(g => ({
  id: g.id, goods_type_id: g.goodsTypeId, name: g.name, price: g.price,
  currency_id: g.currencyId, place_id: g.placeId, deleted: g.deleted,
}))));
out.push(setSeq('goods', Math.max(...goods.map(g => g.id))));

// CURRENCIES
out.push('-- CURRENCIES');
out.push(insert('currencies', currencies.map(c => ({
  id: c.id, name: c.name, code: c.code, symbol: c.symbol,
  min_recharge_amount_warn: c.minRechargeAmountWarn,
  max_recharge_amount_warn: c.maxRechargeAmountWarn,
  blocked: c.blocked,
}))));
out.push(setSeq('currencies', Math.max(...currencies.map(c => c.id))));

// CURRENCY_ACCOUNTS
out.push('-- CURRENCY_ACCOUNTS');
out.push(insert('currency_accounts', currencyAccounts.map(a => ({
  id: a.id, user_id: a.userId, currency_id: a.currencyId,
  current_amount: a.currentAmount, overdraft_limit: a.overdraftLimit,
}))));
out.push(setSeq('currency_accounts', Math.max(...currencyAccounts.map(a => a.id))));

// CARDS
out.push('-- CARDS');
out.push(insert('cards', cards.map(c => ({
  id: c.id, uid: c.uid, user_id: c.userId,
}))));
out.push(setSeq('cards', Math.max(...cards.map(c => c.id))));

// GROUPS
out.push('-- GROUPS');
out.push(insert('groups', groups.map(g => ({
  id: g.id, name: g.name, color: g.color,
}))));
out.push(setSeq('groups', Math.max(...groups.map(g => g.id))));

// USER_GROUPS
out.push('-- USER_GROUPS');
out.push(insert('user_groups', userGroups.map(ug => ({
  user_id: ug.userId, group_id: ug.groupId,
}))));

// TRANSACTIONS
out.push('-- TRANSACTIONS');
out.push(insert('transactions', transactions.map((t: any) => ({
  id: t.id, user_id: t.userId, place_id: t.placeId,
  amount: t.amount, currency_id: t.currencyId,
  created_at: t.createdAt,
}))));
out.push(setSeq('transactions', Math.max(...transactions.map((t: any) => t.id))));

out.push('');
out.push('COMMIT;');

const outPath = resolve(__dirname, '..', 'seed', 'seed.sql');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out.join('\n'), 'utf8');
console.log(`Wrote ${outPath}`);
```

- [ ] **Step 2: Create `e2e/seed/.gitkeep`**

```bash
mkdir -p e2e/seed
touch e2e/seed/.gitkeep
```

- [ ] **Step 3: Generate the seed**

```bash
npm run e2e:gen-sql
```

Expected: `Wrote /home/.../e2e/seed/seed.sql`. Open the file and skim it — values should look correct.

- [ ] **Step 4: Commit**

```bash
git add e2e/fixtures/sql-generator.ts e2e/seed/seed.sql e2e/seed/.gitkeep
git commit -m "feat(e2e): add SQL seed generator and initial seed.sql"
```

---

### Task 15: Smoke test — proves the entire stack works

This test exercises: Playwright config + ng serve + mock layer + persona injection + selectors + dropdown card scan + a real action. If this passes, the foundation is solid.

**Files:**
- Create: `e2e/tests/smoke.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
import { test, expect } from '../support/personas';
import { SEL } from '../support/selectors';
import { adminUser, memberUser } from '../fixtures/data/users';
import { scanCard } from '../support/pos';

test.describe('Smoke', () => {
  test('admin lands on /sale after login', async ({ asAdmin }) => {
    await asAdmin.goto('/');
    // App default redirect: '/' → '/sale'
    await expect(asAdmin).toHaveURL(/\/sale|\/place-select/);
    // top menu shows admin name (set in JWT)
    await expect(asAdmin.getByText(adminUser.name)).toBeVisible();
  });

  test('admin can navigate to /admin/users and sees the user list', async ({ asAdmin }) => {
    await asAdmin.goto('/admin/users');
    await expect(asAdmin.getByTestId(SEL.row.user(memberUser.id!))).toBeVisible();
  });

  test('worker on /sale can scan a card via debug dropdown and customer loads', async ({ asWorker }) => {
    await asWorker.goto('/sale');
    await scanCard(asWorker, 'Marie Členka');
    // Customer balance should appear in the topbar
    await expect(asWorker.getByTestId(SEL.topMenu.balance)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
npm run e2e -- --reporter=list smoke.spec.ts
```

Expected: 3 passed.

If failures occur, common causes:
- `webServer` couldn't start ng serve → check `npm start --prefix ..` issue, override command in config.
- Mock 401 → fixture user mismatch with JWT injection (check `MockAuthAdapter.loginAs`).
- Card dropdown empty → `cards.ts` users not in fixtures, or `installApiMock` not registered before navigation (check fixture order in `personas.ts`).
- `expect(getByText('Marie Členka'))` on top menu — the menu may show role or member ID instead; adjust assertion to whatever the topbar actually shows for the user.

Iterate until green. Each failure is a real bug to fix in the foundation.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/smoke.spec.ts
git commit -m "test(e2e): add foundation smoke test"
```

---

### Task 16: README

**Files:**
- Create: `e2e/README.md`

- [ ] **Step 1: Write the README**

```markdown
# E2E Tests (Playwright)

Foundation for the Kredsys E2E test suite. See
`docs/superpowers/specs/2026-04-26-playwright-e2e-tests-design.md` for the full design.

## Quick start

```bash
npm install
npx playwright install chromium
npm run e2e
```

The test runner starts `ng serve` automatically. Default mode is `mock` — no
backend required.

## Modes

| Mode | Command | Use case |
|---|---|---|
| `mock` (default) | `npm run e2e` | Fast, deterministic, offline, full HTTP intercept |
| `real` | `npm run e2e:real` | Against a running backend with `seed.sql` loaded |

In real mode, the backend + frontend must already be running. Override the
target URL with `E2E_BASE_URL=https://...`.

## Useful commands

```bash
npm run e2e               # mock mode, headless
npm run e2e:headed        # mock mode, visible browser
npm run e2e:ui            # Playwright UI mode
npm run e2e:report        # open last HTML report
npm run e2e:gen-sql       # regenerate e2e/seed/seed.sql from fixtures
```

## Layout

- `fixtures/data/` — TypeScript fixtures (single source of truth)
- `fixtures/api-mock.ts` + `api-mock-handlers.ts` — `page.route()` registry
- `fixtures/auth-adapter.ts` — Mock vs Real login adapter
- `fixtures/sql-generator.ts` — emits `seed/seed.sql`
- `support/personas.ts` — `asAdmin` / `asWorker` / `asPowerSalesman` / `asMember`
- `support/pos.ts` — `scanCard`, `scanNewCard`, `addToBasket`, `submitOrder`
- `support/selectors.ts` — `SEL.*` constants matching `data-testid` attributes
- `support/messages.ts` — Czech UI text constants
- `tests/` — Playwright specs

## Adding a test

```typescript
import { test, expect } from '../support/personas';
import { SEL } from '../support/selectors';

test('admin sees users list', async ({ asAdmin }) => {
  await asAdmin.goto('/admin/users');
  await expect(asAdmin.getByTestId(SEL.row.user(4))).toBeVisible();
});
```

## Adding a fixture

1. Edit the relevant file in `fixtures/data/`.
2. Re-run `npm run e2e:gen-sql` to regenerate `seed/seed.sql`.
3. Commit both the fixture change and the regenerated SQL.

## Known limitations

- HTTP error simulations (5xx, network failure) only work in mock mode.
  These tests are skipped automatically in real mode.
- Web Bluetooth (printer) is out of scope.
- Chromium only — Web NFC/BT are Chromium-only anyway.
```

- [ ] **Step 2: Commit**

```bash
git add e2e/README.md
git commit -m "docs(e2e): add README"
```

---

## Self-Review Notes

Run a final sanity check:

```bash
npm run e2e -- --reporter=list smoke.spec.ts
```

Expected: 3/3 passing.

Then verify the SQL generator still works:

```bash
npm run e2e:gen-sql
```

Expected: `e2e/seed/seed.sql` regenerated, no diff if fixtures haven't changed.

If both green: foundation is complete and ready for Plans 2–5.
