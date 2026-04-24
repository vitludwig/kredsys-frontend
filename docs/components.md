---
name: Components
description: All components with location, purpose, key inputs/outputs, and usage notes
load_when: adding a new component, understanding existing component API, template integration
---

# Components

---

## Layout

### `AppComponent` — `app.component.ts`
Root. Contains `<mat-sidenav-container>` with `SideMenuComponent` + `<router-outlet>`.
Hides top menu when URL param `hideTopMenu=true` is present.

### `TopMenuComponent` — `common/modules/menu/components/top-menu/`
Header bar. Shows: current page breadcrumb, selected place name, customer balance (when on sale), logout.
Input: none (reads from `PlaceService`, `CustomerService`, `AuthService`).

### `SideMenuComponent` — `common/modules/menu/components/side-menu/`
Nav links filtered by `userRoles | canAccessRoute`. Shows debug toggle, printer controls, user name/role.

---

## Common / Reusable

### `CardLoaderComponent` — `app-card-loader`
Reads NFC card ID. Displays loading state and optionally a "New Card" button.
```html
<app-card-loader
  (cardIdChange)="onCardId($event)"
  [showNewCardButton]="false">
</app-card-loader>
```

### `AnimatedLoaderComponent` — `app-animated-loader`
Inline spinner (no inputs). Use inside buttons when `payInProgress`:
```html
<button [disabled]="inProgress">
  Submit
  @if (inProgress) { <app-animated-loader /> }
</button>
```

### `ConfirmDialogComponent`
Opened via `MatDialog`. Returns `true` on confirm, falsy on cancel.

### `ClickConfirmDirective` — `(clickConfirm)` / `confirmPreset`
Intercepts click → opens confirm dialog → emits only on confirm.
```html
<button (clickConfirm)="delete(id)" confirmPreset="remove">
  <mat-icon>delete</mat-icon>
</button>
```

### `ErrorMessageComponent` — `app-error-message`
Displays inline validation/error text. Used inside forms.

### `InputAutocompleteComponent` — `app-input-autocomplete`
Material autocomplete wrapper. Part of `SharedModule`.

### `AutofocusDirective` — `[appAutofocus]`
Auto-focuses the host element on `AfterViewInit`. Used on first form field.

### `BackButtonDirective` — `[backButton]`
Navigates browser history back on click.
```html
<button mat-raised-button backButton>Zpět</button>
```

---

## Sale Module (`modules/sale/`)

### `SaleComponent`
Shell. Handles customer selection via `CardLoaderComponent`. Shows `DashboardComponent` when customer is loaded. Manages 10-second group refresh polling.

### `DashboardComponent`
Product grid filtered by `FilterPanelComponent`. Passes items to `OrderService`. Right panel: `SaleSummaryComponent`.

### `SaleItemComponent`
Single product card. Inputs: `item: IGoods`. Emits: add-to-cart on click.

### `FilterPanelComponent`
Goods-type category filter. Uses `IsIncludedPipe` for active state.

### `SaleSummaryComponent`
Shows basket, total, `totalLeft` (balance - total), overdraft indicator, submit button.
Submits via `SaleService.submitOrder()`. Shows `AnimatedLoaderComponent` while `payInProgress`.

### `ChargeDialogComponent`
Top-up wallet. Opens as `MatDialog`. Uses `ChargeFormComponent`.

### `DischargeDialogComponent`
Withdrawal. Opens as `MatDialog`.

### `StornoDialogComponent`
Transaction reversal. Requires `PlaceService` (mocked in tests as `{ selectedPlace: { id, name } }`).

---

## Admin Module (`modules/admin/`)

### User management
- `UserListComponent` — paginated table, links to edit/change-password
- `UserDetailComponent` — create / edit form with role selector and group assignment
- `ChangePasswordComponent` — password change form

### Place management
- `PlaceListComponent` — table
- `PlaceDetailComponent` — form + goods sortiment with `CdkDragDrop`; "confirm position" button enabled only when `goodsPositionChanged`
- `SortimentDetailComponent` — dialog to add goods to a place

### Goods management
- `GoodsListComponent`, `GoodsDetailComponent`, `GoodsTypeDetailComponent`

### Currency management
- `CurrencyListComponent`, `CurrencyDetailComponent`

### Charge
- `ChargeComponent` — admin top-up page
- `ChargeFormComponent` — reusable form; also used in `SaleModule`'s `ChargeDialogComponent`

### Transactions
- `TransactionsComponent` — tabbed view: all / by place / by user
- `TransactionsListComponent` — shared table
- `StatisticsTableComponent` — aggregated stats
- `NewTransactionComponent` — manual transaction entry

---

## Groups Module (standalone — `modules/groups/`)

- `GroupsListComponent` — table with edit/delete
- `GroupDetailComponent` — form with color picker (`groupForm.get('color')?.value`)
- `GroupsStatisticsComponent` — Chart.js bar chart via `BaseChartDirective`; module must provide `provideCharts(withDefaultRegisterables())`

---

## Card Info Module (`modules/card-info/`)

- `CardInfoComponent` — shows balance, groups (access via `user?.groups?.[0]`), QR code (`QRCodeComponent`)
- `CardInfoConfigDialogComponent` — config dialog
- `CardInfoPublicComponent` — public (no auth) variant; uses `QRCodeComponent`

---

## Check-In Module (`modules/check-in/`)

- `CheckInComponent` — registration form: member ID, name, email, group picker, card assignment

---

## Key notes

- Selector prefix `app-` for all components (lint rule: `@angular-eslint/component-selector`)
- All NgModule components have `standalone: false`
- `user?.groups?.[0]` — `groups` may be absent; use optional chaining
