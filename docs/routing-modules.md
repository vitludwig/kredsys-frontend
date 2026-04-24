---
name: Routing & Modules
description: Top-level routes, admin sub-routes, NgModule structure, standalone modules, lazy loading
load_when: adding a route, new module, changing navigation, lazy-loading a feature
---

# Routing & Modules

## Top-level routes (`app-routing.module.ts`)

| Path | Target | Guards |
|------|--------|--------|
| `/` | redirect → `/sale` | — |
| `/login/sign-in` | `LoginModule` (lazy) | — |
| `/public/card-info` | `CardInfoPublicComponent` standalone (lazy) | — |
| `/sale` | `SaleModule` (lazy) | `authGuard`, `placeGuard` |
| `/admin/**` | `AdminModule` (lazy) | `authGuard` |
| `/place-select` | `PlaceSelectModule` (lazy) | `authGuard` |
| `/check-in` | `CheckInModule` (lazy) | `authGuard` |
| `/card-info` | `CardInfoModule` (lazy) | `authGuard` |

Route strings → always use `ERoute.*` enum constants, never hardcode strings.

## Admin sub-routes (`admin-routing.module.ts`)

```
/admin/users
  /new, /:id/edit, /:id/change-password

/admin/places
  /new, /:id/edit           [unsavedChangesGuard]

/admin/goods
  /new, /:id/edit
  /types/new, /types/:id/edit

/admin/currencies
  /new, /:id/edit

/admin/groups              ← standalone loadComponent routes
  /new, /:id/edit, /statistics

/admin/transactions
  /:id? (optional place filter)

/admin/charge              [placeGuard]
```

## NgModules

| Module | Key imports | Notes |
|--------|-------------|-------|
| `AppModule` | `SharedModule`, `BrowserAnimationsModule`, `MatSidenavModule`, `MenuModule`, `SaleModule`, `WebBluetoothModule` | Root; registers `authInterceptor` via `HTTP_INTERCEPTORS`; `provideHttpClient(withInterceptorsFromDi())` |
| `SharedModule` | `CommonModule`, `FormsModule`, `ReactiveFormsModule`, `MatSnackBarModule`, `InputAutocompleteModule`, `BackButtonDirective` | Re-exported to all feature modules |
| `SaleModule` | `DashboardModule`, `MatDialogModule`, chart providers | Main POS |
| `AdminModule` | sub-modules per entity | Full CRUD |
| `TransactionsModule` | `BaseChartDirective`, `providers: [provideCharts(withDefaultRegisterables())]` | Chart requires this provider |

## Standalone features

- **Groups** — `loadComponent()` routes in `groups.routes.ts`, no NgModule
- **Public** — `loadComponent()` routes in `public.routes.ts`, no auth
- `QRCodeComponent` imported directly (angularx-qrcode v21, no `QRCodeModule`)
- `BaseChartDirective` imported directly (ng2-charts v10, no `NgChartsModule`)
- Standalone pipes (`IsIncludedPipe`, `IsFeatureAllowedPipe`) go in `imports[]`

## APP_INITIALIZER sequence

```
InitService.init()
  1. ConfigService.load()             → GET /assets/config.json
  2. AuthService.tryAutoLogin()       → decode JWT from localStorage
  3. CurrencyService.loadDefaultCurrency()
```
