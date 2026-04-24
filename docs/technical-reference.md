# Kredsys Frontend — Technical Reference

> Angular 21 SPA for a credit/wallet system used at events. Supports multi-role users, place-scoped sales, account top-ups, transaction history, and administrative management.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Routing](#3-routing)
4. [Modules](#4-modules)
5. [Services](#5-services)
6. [Components](#6-components)
7. [Types & Interfaces](#7-types--interfaces)
8. [Guards, Interceptors, Pipes, Directives](#8-guards-interceptors-pipes-directives)
9. [Caching System](#9-caching-system)
10. [Authentication Flow](#10-authentication-flow)
11. [State Management](#11-state-management)
12. [Configuration & Environment](#12-configuration--environment)
13. [Testing](#13-testing)
14. [Build & Deployment](#14-build--deployment)
15. [Patterns & Conventions](#15-patterns--conventions)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 |
| UI Library | Angular Material 21 + Bootstrap 5.1.3 |
| Reactive | RxJS 7.5.0 |
| Auth | JWT (jwt-decode 3.1.2) |
| Charts | Chart.js 3.8.0 + ng2-charts 10 (`BaseChartDirective`) |
| Bluetooth | Angular Web Bluetooth |
| QR codes | angularx-qrcode 21 (`QRCodeComponent`) |
| Permissions | ngx-permissions 19 |
| Printing | receipt-printer-encoder (UMD bundle in assets/vendor/) |
| CSS | SCSS (component-scoped), Bootstrap global |
| Language | TypeScript 6.0, strict mode |
| Linting | ESLint 8 + `@angular-eslint` 21 + `@typescript-eslint` 8 |
| Production server | Express 4 with gzip |

---

## 2. Project Structure

```
kredsys-frontend/
├── src/
│   ├── app/
│   │   ├── app.module.ts              # Root NgModule
│   │   ├── app-routing.module.ts      # Top-level routes
│   │   ├── app.component.ts           # Root component (router-outlet + side menu)
│   │   ├── shared.module.ts           # Re-exported common imports
│   │   ├── common/
│   │   │   ├── components/            # Reusable UI components
│   │   │   ├── decorators/            # @cache, @invalidateCache, @debounce
│   │   │   ├── interceptors/          # authInterceptor (functional)
│   │   │   ├── modules/
│   │   │   │   ├── feature-flags/     # FeatureFlagService + IsFeatureAllowedPipe
│   │   │   │   └── menu/              # TopMenuComponent, SideMenuComponent
│   │   │   ├── pipes/                 # IsIncludedPipe (standalone)
│   │   │   ├── services/
│   │   │   │   ├── alert/             # AlertService (snackbar)
│   │   │   │   ├── config/            # ConfigService (runtime config)
│   │   │   │   └── init/              # InitService (APP_INITIALIZER)
│   │   │   ├── types/                 # All shared interfaces and enums
│   │   │   └── utils/                 # FormValidator, StringUtils, Utils, guards
│   │   └── modules/
│   │       ├── admin/                 # Admin panel (lazy-loaded, NgModule)
│   │       ├── card-info/             # Card info display (lazy-loaded, NgModule)
│   │       ├── check-in/              # User registration (lazy-loaded, NgModule)
│   │       ├── groups/                # Group management (standalone, lazy-loaded)
│   │       ├── login/                 # Login page (lazy-loaded, NgModule)
│   │       ├── place-select/          # Place picker (lazy-loaded, NgModule)
│   │       ├── public/                # Public card-info (standalone, no auth)
│   │       └── sale/                  # POS / sales interface (lazy-loaded, NgModule)
│   ├── assets/
│   │   ├── config.json                # Runtime config overrides (deployed separately)
│   │   ├── finish.mp3                 # Audio cue on sale completion
│   │   └── vendor/receipt-printer-encoder.umd.js
│   └── environments/
│       ├── environment.ts             # Development
│       └── environment.prod.ts        # Production
├── server/server.js                   # Express production server
├── docs/                              # Documentation
├── angular.json
├── karma.conf.js
├── tsconfig.json
└── proxy.conf.json                    # Dev proxy: /api/v1.1 → localhost:8080
```

---

## 3. Routing

### Top-level (`app-routing.module.ts`)

| Path | Module / Component | Guards |
|------|--------------------|--------|
| `/` | redirect → `/sale` | — |
| `/login/sign-in` | `LoginModule` | — |
| `/public/card-info` | `CardInfoPublicComponent` (standalone) | — |
| `/sale` | `SaleModule` | `authGuard`, `placeGuard` |
| `/admin/**` | `AdminModule` | `authGuard` |
| `/place-select` | `PlaceSelectModule` | `authGuard` |
| `/check-in` | `CheckInModule` | `authGuard` |
| `/card-info` | `CardInfoModule` | `authGuard` |

### Admin sub-routes (`admin-routing.module.ts`)

```
/admin/users
  /new                     → UserDetailComponent
  /:id/edit                → UserDetailComponent
  /:id/change-password     → ChangePasswordComponent

/admin/places
  /new                     → PlaceDetailComponent  [unsavedChangesGuard]
  /:id/edit                → PlaceDetailComponent  [unsavedChangesGuard]

/admin/goods
  /new                     → GoodsDetailComponent
  /:id/edit                → GoodsDetailComponent
  /types/new               → GoodsTypeDetailComponent
  /types/:id/edit          → GoodsTypeDetailComponent

/admin/currencies
  /new                     → CurrencyDetailComponent
  /:id/edit                → CurrencyDetailComponent

/admin/groups              (standalone components)
  /new                     → GroupDetailComponent
  /:id/edit                → GroupDetailComponent
  /statistics              → GroupsStatisticsComponent

/admin/transactions
  /:id (optional)          → TransactionsComponent

/admin/charge              [placeGuard]  → ChargeComponent
```

### Route enum (`ERoute`)

All route strings are centralised in `src/app/common/types/ERoute.ts`. Always use `ERoute.*` constants when constructing `router.navigate()` calls — never hardcode strings.

---

## 4. Modules

### AppModule

- Bootstraps `AppComponent`
- Provides `APP_INITIALIZER` → `InitService.init()` (loads config, authenticates, loads default currency)
- Provides Czech `MatPaginatorIntl` via `CustomPaginatorConfiguration()`
- Registers `authInterceptor` via `HTTP_INTERCEPTORS`
- Imports: `SharedModule`, `BrowserAnimationsModule`, `MatSidenavModule`, `MenuModule`, `SaleModule`, `WebBluetoothModule`
- HTTP: `provideHttpClient(withInterceptorsFromDi())`

### SharedModule

Re-exports used across all feature modules: `CommonModule`, `FormsModule`, `ReactiveFormsModule`, `MatSnackBarModule`, `InputAutocompleteModule`, `BackButtonDirective`.

### Feature Modules (lazy-loaded)

| Module | Key Services injected | Notes |
|--------|-----------------------|-------|
| `SaleModule` | `OrderService`, `CustomerService`, `SaleService`, `PrintService` | Main POS screen |
| `AdminModule` | `PlaceService`, `UsersService`, `GoodsService`, `CurrencyService` | Full CRUD admin panel |
| `LoginModule` | `AuthService` | Single sign-in page |
| `PlaceSelectModule` | `PlaceService` | Place picker before sale |
| `CheckInModule` | `UsersService`, `CardsService`, `GroupsService` | New user registration + card assignment |
| `CardInfoModule` | `CustomerService` | Displays user balance / card info |

### Standalone modules (newer pattern)

- `GroupsModule` — uses `loadComponent` routes, no NgModule wrapper; `TransactionsModule` provides `provideCharts(withDefaultRegisterables())`
- `PublicModule` — uses `loadComponent` from `public.routes.ts`, no auth
- `QRCodeComponent` imported directly (from `angularx-qrcode` v21, replaces `QRCodeModule`)

### ng2-charts v10

Chart components use `BaseChartDirective` (standalone, imported directly) instead of the removed `NgChartsModule`. Charts modules must provide:
```typescript
providers: [provideCharts(withDefaultRegisterables())]
```

---

## 5. Services

### Core

#### `InitService` (`common/services/init/`)
Called by `APP_INITIALIZER`. Sequence:
1. `ConfigService.load()` — fetches `/assets/config.json` and merges into `environment`
2. `AuthService.tryAutoLogin()` — restores session from stored token
3. `CurrencyService.loadDefaultCurrency()` — preloads default currency

#### `ConfigService` (`common/services/config/`)
Loads `assets/config.json` on startup. Any key present overrides the same key in `environment`. Allows per-deployment config without a rebuild.

#### `AlertService` (`common/services/alert/`)
Wraps `MatSnackBar`. Methods: `success(msg)`, `error(msg)`, `info(msg)`. Used everywhere — inject instead of opening snackbars directly.

### Authentication

#### `AuthService` (`modules/login/services/auth/`)
- Stores JWT in `localStorage`
- `login(email, password)` — POSTs credentials, saves token, decodes roles
- `logout()` — clears token, redirects to login
- `tryAutoLogin()` — checks stored token validity on startup
- Exposes `user$: BehaviorSubject<IUser | null>`
- Token expiry handled in `authInterceptor` (401 → logout)

### Admin Services (all in `modules/admin/services/`)

#### `PlaceService`
- Manages `selectedPlace$: BehaviorSubject<IPlace | null>` — the place the current session is operating in
- CRUD: `getPlaces()`, `getPlace(id)`, `addPlace()`, `editPlace()`, `deletePlace()`
- Place goods: `getPlaceGoods(placeId)`, `addGoods(goodsId, placeId)`, `removeGoods(goodsId, placeId)`, `moveGoods(placeId, goods[])` (reorder)
- Most read methods use `@cache()` decorator; write methods use `@invalidateCache()`

#### `UsersService`
- CRUD for `IUser`
- `getUsers()`, `getUser(id)`, `createUser()`, `updateUser()`, `deleteUser()`
- Card assignment: delegates to `CardsService`

#### `GoodsService`
- CRUD for `IGoods` and `IGoodsType`
- `getGoods()`, `getGoodsTypes()` — both cached

#### `CurrencyService`
- CRUD for `ICurrency`
- `defaultCurrency$: BehaviorSubject<ICurrency | null>` — single shared instance
- `getCurrencyAccount(userId)` → `ICurrencyAccount`

#### `CardsService`
- Manages user cards (assign, revoke)

#### `TransactionService`
- `getTransactions(filters)` → paginated `IPaginatedResponse<ITransaction>`
- `getStatistics()` → `ITransactionStatistics`

### Feature Services

#### `OrderService` (`modules/sale/services/order/`)
- Manages current basket: `items: IOrderItem[]`
- `addItem()`, `removeItem()`, `clearOrder()`
- Computes `total: number`

#### `CustomerService` (`modules/sale/services/customer/`)
- `selectedUser$: BehaviorSubject<IUser | null>`
- `currencyAccount$: BehaviorSubject<ICurrencyAccount | null>`
- Fetches and refreshes customer balance

#### `SaleService` (`modules/sale/services/sale/`)
- `submitOrder(userId, items)` → creates transaction
- `storno(transactionId)` → reversal
- `charge(userId, amount)` / `discharge(userId, amount)` → balance operations

#### `PrintService` (`modules/sale/services/print/`)
- Integrates with `receipt-printer-encoder` via Web Bluetooth
- Prints receipt on sale completion when printer is connected

#### `GroupsService` (`modules/groups/services/`)
- `getGroups()` → `IPaginatedResponse<IGroup>`
- `getGroupStatistics()` → `IGroupStatistics[]`
- `createGroup()`, `updateGroup()`, `deleteGroup()`
- Used in `CheckInComponent` and `CardInfoComponent` for group assignment

#### `FeatureFlagService` (`common/modules/feature-flags/`)
- Reads feature flags from backend or config
- Currently defines `EFeatureFlag.PRINTER`
- Use `IsFeatureAllowedPipe` in templates: `featureFlag | isFeatureAllowed`

---

## 6. Components

### Layout

| Component | Location | Notes |
|-----------|----------|-------|
| `AppComponent` | `app.component.ts` | Root; contains `<mat-sidenav>` + `<router-outlet>` |
| `TopMenuComponent` | `common/modules/menu/components/top-menu/` | Header: breadcrumb, balance display, logout |
| `SideMenuComponent` | `common/modules/menu/components/side-menu/` | Nav links filtered by role; shows user name + role |

### Common / Reusable

| Component | Selector | Purpose |
|-----------|----------|---------|
| `BackButtonDirective` | `[backButton]` | Navigates back in history |
| `ConfirmDialogComponent` | via `MatDialog` | Generic confirmation dialog |
| `ClickConfirmDirective` | `(clickConfirm)` | Wraps a button; emits after user confirms |
| `CardLoaderComponent` | `app-card-loader` | NFC card ID reader with loading state |
| `AnimatedLoaderComponent` | `app-animated-loader` | Inline spinner |
| `ErrorMessageComponent` | `app-error-message` | Inline error display |
| `InputAutocompleteComponent` | `app-input-autocomplete` | Material autocomplete wrapper |
| `AutofocusDirective` | `[appAutofocus]` | Auto-focuses element on init |

### Sale Module

| Component | Purpose |
|-----------|---------|
| `SaleComponent` | Shell: customer scan/select + `DashboardComponent` |
| `DashboardComponent` | Product grid + filter + basket |
| `SaleItemComponent` | Single product card (price, add-to-cart) |
| `FilterPanelComponent` | Category / goods-type filter |
| `SaleSummaryComponent` | Basket total, overdraft indicator, submit button |
| `ChargeDialogComponent` | Top-up wallet dialog |
| `DischargeDialogComponent` | Withdrawal dialog |
| `StornoDialogComponent` | Reversal (storno) dialog |

### Admin Module

| Component | Purpose |
|-----------|---------|
| `UserListComponent` | Paginated user table |
| `UserDetailComponent` | Create/edit user form |
| `ChangePasswordComponent` | Password change form |
| `PlaceListComponent` | Place table |
| `PlaceDetailComponent` | Create/edit place + sortiment management (CdkDragDrop) |
| `SortimentDetailComponent` | Dialog to add goods to a place |
| `GoodsListComponent` | Goods table |
| `GoodsDetailComponent` | Create/edit goods item |
| `GoodsTypeDetailComponent` | Create/edit goods type |
| `CurrencyListComponent` | Currency table |
| `CurrencyDetailComponent` | Create/edit currency |
| `ChargeComponent` | Admin top-up page (wraps `ChargeFormComponent`) |
| `ChargeFormComponent` | Reusable charge form (also used in `SaleModule`) |
| `TransactionsComponent` | Transaction list with tabs (all / by place / by user) |
| `TransactionsListComponent` | Shared transaction table |
| `StatisticsTableComponent` | Aggregated statistics table |
| `NewTransactionComponent` | Manual transaction entry |

### Groups Module (standalone)

| Component | Purpose |
|-----------|---------|
| `GroupsListComponent` | Table of all groups |
| `GroupDetailComponent` | Create/edit group (name + color picker) |
| `GroupsStatisticsComponent` | Per-group statistics with Chart.js (`BaseChartDirective`) |

### Card Info Module

| Component | Purpose |
|-----------|---------|
| `CardInfoComponent` | Shows user balance, groups, QR code; used at info-point places |
| `CardInfoConfigDialogComponent` | Dialog to configure what is shown on the card info screen |
| `CardInfoPublicComponent` | Public (no auth) read-only card info view |

### Check-In Module

| Component | Purpose |
|-----------|---------|
| `CheckInComponent` | Registration form: member ID, name, email, group, card assignment |

---

## 7. Types & Interfaces

All shared types live in `src/app/common/types/`.

### Core Entities

```typescript
interface IUser {
  id?: number;
  name: string;
  email: string;
  password?: string;
  memberId: number | null;
  roles: EUserRole[];
  blocked: boolean;
  groups?: number[];        // array of group IDs
}

enum EUserRole { ADMIN = 'Admin', MEMBER = 'Member', WORKER = 'Worker', POWER_SALESMAN = 'PowerSalesman' }

interface IPlace {
  id?: number;
  name: string;
  type?: EPlaceRole;
  apiToken?: string;
}

enum EPlaceRole { BAR = 'Bar', USER_INFO = 'UserInfo', REGISTRATION = 'Registration', INFO_POINT = 'Info' }

interface IGoods {
  id?: number;
  goodsTypeId: number | null;
  name: string;
  price: number | null;
  currencyId: number | null;
  placeId: number | null;
  deleted: boolean;
}

interface IGoodsType { id?: number; name: string; icon: string; deleted: boolean; }

interface ICurrency {
  id?: number;
  name: string;
  code: string;
  symbol: string;
  minRechargeAmountWarn: number;
  maxRechargeAmountWarn: number;
  blocked: boolean;
}

interface ICurrencyAccount {
  id: number;
  userId: number;
  overdraftLimit: number;   // positive number = max allowed negative balance
  currentAmount: number;    // always a number, never undefined
  currencyId: number;
}
```

### Groups (in `modules/groups/types/`)

```typescript
interface IGroup { id: number; name: string; color: string; }
interface IGroupCreate { name: string; color: string; }
interface IGroupStatistics { group: IGroup; items: IGroupStatisticsItem[]; }
interface IGroupStatisticsItem { label: string; value: number; }
```

### Utilities

```typescript
interface IPaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
type HashMap<T> = { [key: string]: T };
type EnumHashMap<TKey extends string, TValue> = { [key in TKey]: TValue };
type TAnyFunction = (...args: any[]) => any;
interface CanComponentDeactivate { canDeactivate(): boolean | Promise<boolean>; }
```

### Enums

```typescript
enum ERoute { LOGIN, LOGIN_SIGN_IN, SALE, ADMIN, ADMIN_USERS, ADMIN_PLACES, ADMIN_GOODS,
              ADMIN_GOODS_TYPES, ADMIN_CURRENCIES, ADMIN_CHARGE, ADMIN_TRANSACTIONS,
              ADMIN_CHANGE_PASSWORD, ADMIN_GROUPS, ADMIN_STATISTICS,
              PLACE_SELECT, CHECK_IN, CARD_INFO, PUBLIC, EDIT, NEW }

enum ECacheTag { USER, USERS, USER_CARDS, TRANSACTION, TRANSACTIONS,
                 GOODS, GOODIE, CURRENCY, CURRENCIES, PLACE, PLACES, CARDS }

enum ETime { SECOND = 1000, MINUTE = 60000, HOUR = 3600000, DAY = 86400000, WEEK = 604800000 }

enum EFeatureFlag { PRINTER = 'printer' }
```

---

## 8. Guards, Interceptors, Pipes, Directives

### Route Guards (`src/app/common/utils/`)

All guards are **functional** (`CanActivateFn` / `CanDeactivateFn`), not class-based.

| Guard | Type | Behaviour |
|-------|------|-----------|
| `authGuard` | `CanActivateFn` | Checks `AuthService.isLoggedIn()`; redirects to `/login/sign-in` if not |
| `placeGuard` | `CanActivateFn` | Checks `PlaceService.selectedPlace$`; redirects to `/place-select` if null |
| `unsavedChangesGuard` | `CanDeactivateFn<CanComponentDeactivate>` | Calls `component.canDeactivate()`; component shows `window.confirm` if dirty |

### HTTP Interceptor

**`authInterceptor`** (`common/interceptors/auth/auth.interceptor.ts`) — **functional** (`HttpInterceptorFn`):
- Clones every outgoing request and adds `Authorization: Bearer <token>`
- On 401 response: calls `AuthService.logout()` and redirects to login
- Registered in `AppModule` via `HTTP_INTERCEPTORS` token with `provideHttpClient(withInterceptorsFromDi())`

### Pipes

| Pipe | Selector | Input → Output |
|------|----------|----------------|
| `IsIncludedPipe` | `isIncluded` | `item \| isIncluded: array` → `boolean` (standalone) |
| `IsFeatureAllowedPipe` | `isFeatureAllowed` | `EFeatureFlag \| isFeatureAllowed` → `boolean` (standalone) |
| `PageNamePipe` | `pageName` | Router event → page display name string (used in breadcrumb) |

Standalone pipes go in `imports[]`, not `declarations[]`.

### Directives

| Directive | Event | Behaviour |
|-----------|-------|-----------|
| `ClickConfirmDirective` | `(clickConfirm)` | Opens `ConfirmDialogComponent`; emits output event only on confirm. Use `confirmPreset="remove"` for delete operations |
| `AutofocusDirective` | — | Calls `.focus()` on `AfterViewInit` |
| `BackButtonDirective` | `(click)` | Calls `Location.back()` |

---

## 9. Caching System

Defined in `src/app/common/decorators/cache.ts`.

### How it works

`createCacher(fn, timeoutMs, tags[])` wraps an async function:
- First call with given args → executes the function, stores result
- Subsequent calls with same args within `timeoutMs` → returns cached result immediately
- Cache is **argument-signature-based** (`JSON.stringify(args)` as key)
- Parallel calls during fetch are **queued** — only one HTTP request fires; all callers receive the same result
- Cache is automatically evicted after `timeoutMs` milliseconds

### Tag-based invalidation

- `@cache(timeout, [ECacheTag.USERS])` — marks data with tags
- `@invalidateCache([ECacheTag.USERS])` — updates `cacheTags[tag]` timestamp after method resolves
- On next read, if `cacheTags[tag] > fetchTime`, the cache is considered stale

### Decorators (service methods)

```typescript
@cache(ETime.MINUTE, [ECacheTag.USERS])
async getUsers(): Promise<IUser[]> { ... }

@invalidateCache([ECacheTag.USER, ECacheTag.USERS])
async updateUser(user: IUser): Promise<void> { ... }
```

### Test cleanup

Call `clearAllCaches()` in `beforeEach` to reset all cache state between tests. All cachers self-register in a global registry.

---

## 10. Authentication Flow

```
App start
  └─ APP_INITIALIZER → InitService.init()
       ├─ ConfigService.load()
       ├─ AuthService.tryAutoLogin()    ← reads token from localStorage
       │    ├─ valid token → decode IUser, set user$ BehaviorSubject
       │    └─ expired/missing → user$ = null
       └─ CurrencyService.loadDefaultCurrency()

Login page
  └─ AuthService.login(email, pass)
       ├─ POST /api/v1.1/authentication/user/email
       ├─ store token in localStorage
       ├─ decode JWT → IUser
       ├─ set user$ BehaviorSubject
       └─ navigate to /sale

Every HTTP request
  └─ authInterceptor adds Authorization header
       └─ on 401 → AuthService.logout() → navigate to login

Place selection (after login)
  └─ placeGuard blocks /sale and /admin/charge
       └─ redirects to /place-select until PlaceService.selectedPlace$ is set
```

---

## 11. State Management

No NgRx or external store — state is managed via **injectable services with BehaviorSubjects**.

| State | Owner | Consumers |
|-------|-------|-----------|
| Current user | `AuthService.user$` | `SideMenuComponent`, `TopMenuComponent`, guards |
| Selected place | `PlaceService.selectedPlace$` | `placeGuard`, `ChargeComponent`, `SaleComponent` |
| Default currency | `CurrencyService.defaultCurrency$` | `SaleComponent`, `TopMenuComponent` |
| Customer balance | `CustomerService.currencyAccount$` | `SaleSummaryComponent`, `CardInfoComponent` |
| Selected customer | `CustomerService.selectedUser$` | `SaleComponent`, `SaleSummaryComponent` |
| Cart items | `OrderService.items` (plain array) | `DashboardComponent`, `SaleSummaryComponent` |

---

## 12. Configuration & Environment

### `environment.ts` (development)

```typescript
{
  production: false,
  apiUrl: '/api/v1.1/',           // proxied to localhost:8080 via proxy.conf.json
  debug: true,
  walletApiSecret: '...',         // HMAC secret for wallet hash
  cruciblePrice: 60               // business-specific constant
}
```

### Runtime config (`assets/config.json`)

Loaded at startup by `ConfigService`. Any key present overrides `environment`. In production the file is deployed separately to allow environment-specific config without rebuilding. Ships as `{}` in the repo.

### Dev proxy (`proxy.conf.json`)

```json
{ "/api/v1.1": { "target": "http://localhost:8080", "changeOrigin": true } }
```

Angular 20+ uses a **Vite-based dev server** — proxy keys are **prefix matches**, not glob patterns. The trailing `/*` must be omitted (unlike the old webpack-based proxy).

### TypeScript config (`tsconfig.json`)

Notable options required for Angular 21 + TypeScript 6:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "ignoreDeprecations": "6.0"
  }
}
```
`ignoreDeprecations: "6.0"` suppresses TS6 warnings for `baseUrl` and `downlevelIteration` which are still referenced by some tooling.

---

## 13. Testing

### Setup

- Framework: **Jasmine** + **Karma**
- Browser: `ChromeHeadlessNoSandbox` (default; works with snap Chromium)
- Chrome binary: `/snap/chromium/current/usr/lib/chromium-browser/chrome` (set in `karma.conf.js`)
- Coverage: HTML + text-summary → `./coverage/kredsys/`
- Spec files co-located with source: `foo.service.spec.ts` next to `foo.service.ts`

### Commands

```bash
ng test                          # watch mode
ng test --watch=false            # single run
ng test --watch=false --code-coverage
```

### HTTP providers in tests

Use the new functional providers (not the old `HttpClientTestingModule`):
```typescript
providers: [
  provideHttpClient(withInterceptorsFromDi()),
  provideHttpClientTesting(),
]
```

### Functional guards / interceptors in tests

Guards and interceptors are functions, not classes — use `TestBed.runInInjectionContext()`:
```typescript
// Guard
const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

// Interceptor
const nextFn = jasmine.createSpy('next') as HttpHandlerFn;
TestBed.runInInjectionContext(() => authInterceptor(mockRequest, nextFn));
```

### Standalone pipes in tests

Standalone pipes (`IsIncludedPipe`, `IsFeatureAllowedPipe`) go in `imports[]`, never `declarations[]`:
```typescript
imports: [IsIncludedPipe]
```

### Key conventions

- Call `clearAllCaches()` in `beforeEach` in any test touching cached services
- JWT tokens must be valid base64-encoded JSON: use a `createMockJwt(payload)` helper — plain strings like `'jwt-token'` throw `InvalidTokenError`
- Use `TestBed.inject()` to get service instances
- `WithSubscriptionsComponent` base class uses `takeUntil(destroy$)` — call `component.ngOnDestroy()` in `afterEach` to prevent observable leaks

---

## 14. Build & Deployment

### Development

```bash
ng serve          # localhost:4200, hot reload, proxies /api/v1.1 to :8080
```

Dev server is **Vite-based** since Angular 20. Proxy keys are prefix matches (no trailing `/*`).

### Production build

```bash
ng build          # AOT, outputs to dist/kredsys/
```

### Production server

```bash
node server/server.js   # Express on port 80 (env PORT overrides)
```

Express serves `dist/kredsys/` as static files with gzip compression. All unmatched routes return `index.html` (SPA fallback).

---

## 15. Patterns & Conventions

### Service HTTP calls

Services extend no base class. All HTTP calls use `HttpClient` and return `Promise` via `firstValueFrom(this.http.get<T>(...))`. The `@cache` / `@invalidateCache` decorators wrap service methods — not the raw HTTP calls.

### Base component class

`WithSubscriptionsComponent` provides:
- `destroy$: Subject<void>` — emits on `ngOnDestroy`
- Extend in every component that subscribes to observables: use `takeUntil(this.destroy$)`

### Template control flow

All templates use Angular's **built-in control flow** syntax (Angular 17+):
```html
@if (condition) { ... } @else { ... }
@for (item of items; track item.id) { ... }
```
The old `*ngIf` / `*ngFor` directives are not used.

### Navigation

Always use `this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS])` — never hardcode path strings.

### Dialogs

Open via `MatDialog.open<ComponentType>(Component, { data: {...} })`. Component receives data via `MAT_DIALOG_DATA` injection token. Result returned via `dialogRef.close(result)`.

### Form validation display

Pattern used in forms:
```typescript
showValidationErrors: boolean = false;
// set to true on submit attempt; error divs shown only when true
```

### Standalone vs NgModule

New features (Groups, Public) use **standalone components** with `loadComponent()` in routing. Older features use `NgModule` with `loadChildren()`. All NgModule components have `standalone: false` explicitly set (Angular 19 migration requirement). Do not mix patterns within a feature.

### Goods ordering in places

`PlaceDetailComponent` uses `CdkDragDrop` for reordering. The reorder is not saved immediately — a "confirm position" action calls `PlaceService.moveGoods()`. The `unsavedChangesGuard` warns the user on navigation if `goodsPositionChanged === true`.

### Overdraft logic in templates

`ICurrencyAccount.overdraftLimit` is a positive number representing the maximum negative balance allowed. The comparison in templates:

```html
totalLeft < -((account$ | async)?.overdraftLimit ?? 0)
```

### Feature flags in templates

```html
@if (EFeatureFlag.PRINTER | isFeatureAllowed) {
  <app-print-button />
}
```

### ESLint config (`.eslintrc.json`)

Uses legacy `.eslintrc.json` format (ESLint 8). `@typescript-eslint` must be added explicitly to `extends` — `@angular-eslint/recommended` v21 no longer includes it:
```json
"extends": [
  "plugin:@angular-eslint/recommended",
  "plugin:@angular-eslint/template/process-inline-templates",
  "plugin:@typescript-eslint/recommended"
]
```
Use core ESLint `indent` rule — `@typescript-eslint/indent` was removed in `@typescript-eslint` v6.
