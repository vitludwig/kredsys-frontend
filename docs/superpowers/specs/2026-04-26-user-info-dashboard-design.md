# User Info Dashboard — Design Spec

**Date:** 2026-04-26
**Route:** `/admin/user-info`
**Target user:** Info booth staff at a festival
**Device:** Desktop + mouse/keyboard

---

## Overview

A single-page dashboard that gives info booth staff one-stop access to every user account operation. Staff search for a visitor (by name/email/card number, or by tapping an NFC card), then see and act on the visitor's account without navigating away.

---

## Route & Module

New standalone feature at `/admin/user-info`.

- Add `ADMIN_USER_INFO = 'user-info'` to `ERoute` enum (`common/types/`)
- Register a `loadComponent()` route in `admin-routing.module.ts`:
  ```
  { path: ERoute.ADMIN_USER_INFO, component: UserInfoComponent }
  ```
- Add a nav link in `SideMenuComponent` (same pattern as other admin links)
- No guard beyond the existing `authGuard` that covers all `/admin/**`

Files live under:
```
src/app/modules/admin/modules/user-info/
  user-info.component.ts
  user-info.component.html
  user-info.component.scss
  components/
    user-info-detail/
      user-info-detail.component.ts
      user-info-detail.component.html
      user-info-detail.component.scss
    user-info-cards/
      user-info-cards.component.ts
      user-info-cards.component.html
      user-info-cards.component.scss
```

---

## State & Data Flow

`UserInfoComponent` owns the selected-user state:

```typescript
protected selectedUser: IUser | null = null;
protected currencyAccount: ICurrencyAccount | null = null;
protected accountLoaded = false;   // false until first fetch attempt completes
protected transactions: ITransaction[] = [];   // type from TransactionService response — verify in implementation
protected cards: ICard[] = [];                  // type from CardsService — verify in implementation
```

On user selection (`onUserSelected(user: IUser)`):
1. Set `selectedUser = user`
2. Try `CurrencyService.getCurrencyAccount(user.id)` → set `currencyAccount`; on 404/error set `currencyAccount = null`
3. `TransactionService.getTransactions({ userId: user.id })` → set `transactions`
4. `CardsService.getCardsByUser(user.id)` → set `cards` *(verify exact method name — CardsService signatures not in docs)*
5. Set `accountLoaded = true`

On close (`onClose()`): reset all to `null` / empty / `false`.

All async calls follow the `try/catch + AlertService.error()` pattern.

---

## Components

### `UserInfoComponent` — shell

Responsibilities:
- Search bar (text input + debounce → `UsersService.getUsers()` autocomplete)
- "Přiložit kartu" button → reuse `CardLoaderComponent` or its pattern
- "✕ Zavřít" button (red, prominent) — visible only when `selectedUser !== null`
- Conditionally renders `UserInfoDetailComponent` when `selectedUser !== null`

Search input: `mat-form-field` with autocomplete (`InputAutocompleteComponent` or plain `matAutocomplete`). Search by name, email, or card number. Minimum 2 characters before fetching.

Card lookup: when card ID received, call the appropriate `CardsService` method to resolve a card ID to a user *(check actual method name — `getCardsByUser`, `getUserByCardId`, or similar — in the CardsService implementation)*, then call `onUserSelected()`.

### `UserInfoDetailComponent`

Input: `@Input() user: IUser`, `@Input() currencyAccount: ICurrencyAccount | null`, `@Input() accountLoaded: boolean`, `@Input() transactions: ITransaction[]`

Output: `@Output() refresh = new EventEmitter<void>()` — emitted after any mutating action so the parent re-fetches

Sections (in order, top to bottom):

#### 1. Profile card
- Avatar circle (initials fallback if no photo; use `user.name` first letter)
- Name, email, group (from `user.groups[0]` resolved to group name), active/blocked badge
- Member ID: `MBR-{user.memberId}` (or "—" if `memberId` is null)
- Edit button (✏️ top-right corner) → navigate to `/admin/users/:id/edit`

#### 2. Balance card
- Shows `currencyAccount.currentAmount` + unit (Kč) when account exists
- Shows overdraft limit below balance
- When `accountLoaded && currencyAccount === null`: show ⚠ + "Účet ještě nebyl aktivován" + "(první dobití ho vytvoří)"
- While `!accountLoaded`: show `AnimatedLoaderComponent`

#### 3. Primary action buttons (horizontal row, full width)

| Button | Label | Action | Disabled when |
|--------|-------|--------|---------------|
| Filled/primary | ＋ Dobít kredit | Open `ChargeDialogComponent` | never |
| Default | − Vybrat kredit | Open `DischargeDialogComponent` | `currencyAccount === null` |
| Default | ↩ Storno transakce | Open `StornoDialogComponent` | `currencyAccount === null` |
| Default | 🪪 Přiřadit kartu | Open `AssignCardDialogComponent` | never |

After each dialog closes with a truthy result, emit `refresh`.

Reuse existing dialogs from SaleModule where possible:
- `ChargeDialogComponent` — inject `userId` via `MAT_DIALOG_DATA`
- `DischargeDialogComponent` — same
- `StornoDialogComponent` — same

If direct import causes circular dependency, duplicate the dialog under `user-info/dialogs/`.

#### 4. Transaction history

Scrollable list (max-height, `overflow-y: auto`). Each row:
- Description / goods name
- Timestamp (formatted)
- Amount (green for credit, red for debit)
- "storno" link — only for debit transactions that haven't been storned yet; calls `SaleService.storno(transaction.id)` with confirmation via `ClickConfirmDirective`; emits `refresh` on success

Paginated: show first 20, "Načíst více" button at bottom if `total > transactions.length`. Empty state: "Žádné transakce".

#### 5. Cards section (secondary, below transactions)

Rendered by `UserInfoCardsComponent`.

Each card chip shows: masked number (last 4 digits), active/blocked badge, "blokovat"/"odblokovat" action.

Block/unblock: call the appropriate `CardsService` block/unblock methods *(verify names in implementation)* with `ClickConfirmDirective` confirmation; emit `refresh`.

#### 6. Account management (bottom, rarely-used)

Two small buttons with muted styling:
- **Změnit heslo** → navigate to `/admin/users/:id/change-password`
- **Zablokovat uživatele** / **Odblokovat uživatele** (toggle based on `user.blocked`) → call `UsersService.updateUser({ ...user, blocked: !user.blocked })` with `ConfirmDialogComponent` confirmation; emit `refresh`

"Zablokovat" uses red/warn border. "Odblokovat" uses neutral styling.

---

## Dialogs

### `AssignCardDialogComponent`

New dialog (doesn't exist elsewhere). Input: `userId`.

- `CardLoaderComponent` for NFC scan or manual card ID entry
- On card ID received: call the appropriate `CardsService` assign method *(verify name in implementation)*
- Show success/error via `AlertService`
- Close dialog with `true` on success

---

## Error Handling

- All service calls in `try/catch`; errors shown via `AlertService.error()`
- `getCurrencyAccount` 404 is not an error — treated as "no account"
- Storno/block confirmations use `ClickConfirmDirective` or `ConfirmDialogComponent` — no bare `window.confirm()`

---

## Styling

- Follows existing admin panel layout — no custom shell, just a padded content area
- Card sections use `mat-card` with `surface-container` background (`var(--mat-sys-surface-container)`)
- "Zablokovat uživatele" button uses `mat-warn` color or `border: 1px solid var(--mat-sys-error)`
- "✕ Zavřít" button: `mat-raised-button` with `mat-warn` color

---

## Out of Scope

- Multi-currency accounts — only default currency shown
- Photo upload for avatar — initials fallback only
- Print receipt from this screen
- Mobile/tablet layout
