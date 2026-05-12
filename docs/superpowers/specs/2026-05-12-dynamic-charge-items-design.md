# Dynamic Charge Items — Design Spec

**Date:** 2026-05-12
**Status:** Approved

## Overview

Replace the hardcoded "Kelímek" button (driven by `cruciblePrice` in `IAppConfig`) with a dynamic list of named charge items configurable through the admin UI. Items are stored in the backend Settings API and readable by all authenticated users.

---

## Data Layer

### New type: `IChargeItem`

Location: `src/app/common/types/IChargeItem.ts`

```typescript
interface IChargeItem {
  label: string;
  amount: number;
}
```

### New service: `SettingsService`

Location: `src/app/modules/admin/services/settings/settings.service.ts`

```typescript
getChargeItems(): Promise<IChargeItem[]>
saveChargeItems(items: IChargeItem[]): Promise<void>
```

- `getChargeItems()` — GET `/api/v1.1/settings/charge_items`, parse `value` field as JSON. Returns `[]` on 404 or parse error.
- `saveChargeItems()` — PUT `/api/v1.1/settings/charge_items` with `{value: JSON.stringify(items)}`. If the setting does not exist (404 on GET), first POST to create it with `{key: "charge_items", value: ..., isPublic: true, isSystem: false}`.

The backend `Setting` entity stores value as a string (max 5000 chars). JSON for a typical list of 10 items is well within this limit.

### `IAppConfig` cleanup

Remove `cruciblePrice: number` from:
- `src/app/common/services/config/types/IAppConfig.ts`
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

---

## Admin UI — Settings Section

### Route

New lazy route in `admin-routing.module.ts`:
```
/admin/settings → loadComponent(() => ChargeItemsComponent)
```

New constant `ERoute.ADMIN_SETTINGS = 'settings'` added to the route enum.

### `ChargeItemsComponent`

Location: `src/app/modules/admin/modules/settings/components/charge-items/charge-items.component.ts`

- `standalone: true`
- On init: calls `settingsService.getChargeItems()`, populates local `items: IChargeItem[]`
- Template:
  - Editable list — each row: label text input + amount number input + delete button
  - "Přidat" button — appends `{label: '', amount: 0}` to `items`
  - "Uložit" button — calls `saveChargeItems(items)`, on success `alertService.success()`, on error `alertService.error()`
- No caching — data is user-editable, always fetched fresh

### Navigation

New "Nastavení" entry in the admin sidebar/menu pointing to `/admin/settings`.

---

## Charge Dialogs — Updates

Both components drop `cruciblePrice` and inject `SettingsService`. Items are loaded on init and rendered dynamically.

### `ChargeDialogComponent` (`sale/components/charge-dialog/`)

```typescript
protected chargeItems: IChargeItem[] = [];

async ngOnInit() {
  this.chargeItems = await this.settingsService.getChargeItems();
}
```

Template replaces the hardcoded Kelímek button:
```html
@for (item of chargeItems; track item.label) {
  <button mat-stroked-button (click)="amount = item.amount">
    {{ item.label }}
  </button>
}
```

### `ChargeFormComponent` (`admin/modules/charge/components/charge-form/`)

Same change as `ChargeDialogComponent`.

---

## Out of Scope

- Predefined amounts `[500, 800, 1000, 1500, 2000]` remain hardcoded in both components — making those configurable is a separate feature.
- No ordering/sorting of charge items — items appear in the order defined by the admin.
- No per-place charge item configuration.

---

## Error Handling

- If `getChargeItems()` fails (network error, malformed JSON), return `[]` — the charge dialog simply shows no dynamic buttons, predefined amounts still work.
- If `saveChargeItems()` fails, show `alertService.error()` and leave the form in its current state.

---

## Backend Changes

None. The existing `SettingsController` (`POST /api/v1.1/settings`, `PUT /api/v1.1/settings/{key}`, `GET /api/v1.1/settings/{key}`) supports all required operations. The `IsPublic: true` flag ensures non-admin roles (Worker, PowerSalesman) can read the setting.
