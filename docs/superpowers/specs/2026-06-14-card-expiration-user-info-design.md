# Card expiration in user-info — design

**Date:** 2026-06-14
**Status:** Approved (pending spec review)
**Area:** `modules/admin/modules/user-info` + `services/users` + `common/types/ICard`

## Goal

Backend now reflects card expiration on card type `Card` (type `Ticket` is not used here).
On the frontend, in **user-info**, for each card:

1. Show the card's **expiration** (date + time).
2. Allow **changing** the expiration.
3. **Block adding a new card** while the user has an *active* (non-blocked) card that has an
   expiration — the existing expiring card must be **blocked** first.
4. A card added after that **inherits** the expiration of the **last blocked** card.

## Backend contract (confirmed in `kredsys-backend`)

`CardsController` / `UsersController`, base `/api/v1.1/`:

| Action | Method + route | Body | Notes |
|---|---|---|---|
| Assign card | `POST users/{userId}/card` | `UserCardDto.Create` `{ uid, type, description, expirationDate }` | already used by `addUserCard`; today sends `expirationDate: null` |
| Edit card | `PUT cards/{cardId}` | `UserCardDto.Edit` `{ description, type, expirationDate }` | maps whole DTO onto entity; `type` validated `NotNull().IsInEnum()` → **must resend `type` + `description`** |
| Block | `PUT cards/{cardId}/block` | — | returns 200 |
| Unblock | `PUT cards/{cardId}/unblock` | — | returns 200 |
| Delete (hard) | `DELETE cards/{cardId}` | — | **400** if card is referenced by historical transactions |

`UserCard.IsActive() = !Blocked && (ExpirationDate == null || ExpirationDate > DateTime.Now)` —
server **local** time, naive `DateTime` comparison.

### Expiration as wall-clock local time

Expiration is treated as a naive local datetime end-to-end:

- Input: `<input type="datetime-local">` yields e.g. `2026-12-31T23:59` (no timezone).
- Sent to BE **without** a `Z` suffix, so BE stores it and compares against `DateTime.Now` as wall-clock.
- Display: Angular `DatePipe` renders an ISO string without timezone as local — same wall-clock round-trips.

(Single-venue event system: clients and server share a timezone, so no offset surprises.)

## Types — `common/types/ICard.ts`

`expirationDate?: string` already exists. Tighten `type` to an enum per codebase convention:

```ts
export enum EUserCardType { CARD = 'Card', TICKET = 'Ticket' }

export interface ICard {
  id?: number;
  uid?: number;
  description: string;
  type: EUserCardType;       // was: 'Card' | unknown
  expirationDate?: string;   // naive local ISO, e.g. "2026-12-31T23:59:00"
  blocked?: boolean;
  userId?: number;
}
```

## Service — `UsersService` (all card-mutating methods `@invalidateCache([ECacheTag.USER_CARDS])`)

| Method | HTTP | Notes |
|---|---|---|
| `addUserCard(userId, uid, description='', type=EUserCardType.CARD, expirationDate: string \| null = null)` | `POST users/{id}/card` | **extend** existing signature with `expirationDate` (today hard-codes `null`) |
| `setUserCardExpiration(card: ICard, expirationDate: string \| null)` | `PUT cards/{id}` | sends `{ type: card.type, description: card.description ?? '', expirationDate }` to preserve type/description |
| `blockUserCard(cardId)` | `PUT cards/{id}/block` | no body |
| `unblockUserCard(cardId)` | `PUT cards/{id}/unblock` | no body |
| `deleteUserCard(cardId)` | `DELETE cards/{id}` | unchanged; caller handles 400 (used by transactions) |

## Component logic — `UserInfoCardsComponent`

Add-guard (disable "Přiřadit kartu"):

```ts
canAddCard = !cards().some(c => !c.blocked && c.expirationDate != null);
```

A card with expiration that is *not blocked* (even if already expired) blocks adding.
Cards **without** expiration do not block adding.

Inherited expiration (passed to the assign dialog):

```ts
// last blocked card carrying an expiration; ICard has no blockedAt → use highest id
inheritedExpiration =
  cards()
    .filter(c => c.blocked && c.expirationDate != null)
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]?.expirationDate ?? null;
```

When no such card exists (e.g. first card), the new card is added with `null` expiration and the
admin sets it later via the edit (✎) action.

Expired check for display:

```ts
isExpired(card: ICard): boolean {
  return card.expirationDate != null && new Date(card.expirationDate).getTime() <= Date.now();
}
```

Row actions:

- **✎ změnit expiraci** → opens `CardExpirationDialogComponent`, then `setUserCardExpiration`, then `refresh`.
- **zablokovat / odblokovat** → `ConfirmDialog` (on block) → `blockUserCard` / `unblockUserCard` → `refresh`.
- **🗑 smazat** → `ConfirmDialog` → `deleteUserCard`; on 400 show "Kartu nelze smazat — je použita v transakcích".

## UI — `user-info-cards.component.html`

```
...1234   [Aktivní]     31.12.2026 23:59          [✎] [zablokovat] [🗑]
...5678   [Zablokována] 31.12.2026 23:59 (vypršela)    [odblokovat] [🗑]
...9012   [Aktivní]     bez expirace              [✎] [zablokovat] [🗑]
```

- Expiration: `card.expirationDate | date:'dd.MM.yyyy HH:mm'`, else "bez expirace".
- Expired (`isExpired`) → distinct styling + "(vypršela)".
- "Přiřadit kartu" `[disabled]="!canAddCard"` + `matTooltip` "Nejdřív zablokuj stávající kartu s expirací."
- New imports: `DatePipe`, `MatTooltipModule`.

## New dialog — `CardExpirationDialogComponent` (standalone)

- Data in: `{ expirationDate: string | null }` (current value, prefilled).
- Single `<input type="datetime-local">` + "Uložit" / "Vymazat expiraci" / "Zrušit".
- Returns the new value as a naive-local ISO string, or `null` to clear, or `undefined` on cancel.
- Conversion: datetime-local value (`YYYY-MM-DDTHH:mm`) → append `:00` seconds; no `Z`.

## Dialog — `AssignCardDialogComponent` (modify)

- `data` extended to `{ userId: number; expirationDate: string | null }`.
- Passes `expirationDate` into `addUserCard(userId, uid, '', EUserCardType.CARD, expirationDate)`.
- No new UI (inheritance is automatic).

## Testing (TDD)

- `users.service.spec` — `addUserCard` sends `expirationDate`; `setUserCardExpiration` resends `type`+`description`; `blockUserCard`/`unblockUserCard` hit correct routes.
- `user-info-cards.spec` — `canAddCard` guard; `inheritedExpiration` selection; block/unblock/edit handlers call service + emit refresh; delete 400 → error alert.
- `assign-card-dialog.spec` — forwards `expirationDate` to `addUserCard`.
- `card-expiration-dialog.spec` (new) — prefill, save returns ISO, clear returns `null`, cancel returns `undefined`.

## Out of scope / notes

- Card type `Ticket` and ticket-specific endpoints — not used here.
- Unblocking a card while another active expiring card exists is allowed (FE add-guard is the
  protection; BE `IsActive` is the final guard for transactions). No multi-card invariant enforced
  on unblock.
- `getUserByCardUid` / `isCardAssigned` resolve only **active** cards (BE `GetActiveByUidRequiredAsync`);
  unchanged by this work.
```
