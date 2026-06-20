# Ticket-driven card expiration

**Date:** 2026-06-20
**Repos:** `kredsys-frontend` (Angular 21), `kredsys-backend` (.NET 7)
**Status:** Approved design — ready for implementation

## Problem

When a user holds a **ticket** (a `UserCard` of `Type = Ticket`), every access card (`Type = Card`)
assigned to that user must carry **exactly the ticket's expiration**. The expiration is owned by the
ticket, not by the individual card, and must be enforced authoritatively on the backend (so any client —
the user-info dashboard *and* the check-in/registration screen — gets the same result).

When a user has **no ticket**, the existing behaviour is unchanged: each card has its own optional
expiration, and a newly assigned card inherits the most-recently-blocked card's expiration
(`inheritedExpiration`).

## Definitions

- **Governing ticket** of a user = their **non-blocked** `UserCard` with `Type = Ticket`. If a user has
  more than one, the one with the **latest `ExpirationDate`** wins. If none is non-blocked, the user has
  no governing ticket and legacy behaviour applies. The **frontend and backend use this identical rule.**
- **Ticket with expiration** = a governing ticket whose `ExpirationDate != null`.

> Assumption: in practice a user has at most one ticket. The "latest expiration wins" tie-breaker only
> matters for malformed data and keeps the rule deterministic.

## Backend — `kredsys-backend` (authoritative)

No schema change / migration is required — `UserCard.ExpirationDate`, `UserCard.Type`
(`UserCardTypes.Card | Ticket`) and `User.TicketId` already exist.

### B1. Governing-ticket lookup

Add to `App/Dal/Repositories/User/UserCardRepository.cs`:

```csharp
public async Task<UserCard> GetUserActiveTicketAsync(int userId)
{
    return await GetAll(false) // non-blocked only
        .Where(x => x.UserId == userId && x.Type == UserCardTypes.Ticket)
        .OrderByDescending(x => x.ExpirationDate)
        .FirstOrDefaultAsync();
}
```

### B2. Enforce on assign — `UsersController.AssignUserToCard` (`POST users/{userId}/card`)

After `var card = Mapper.Map<UserCard>(cardData)` and before `AddAsync`:

- If `card.Type == UserCardTypes.Card`, look up the user's governing ticket. If one exists, set
  `card.ExpirationDate = ticket.ExpirationDate` — **overriding whatever the client sent**.
- Creating the ticket itself (`card.Type == Ticket`) is untouched.

This endpoint is the same one the **check-in** screen calls, so check-in is covered with no frontend change.

### B3. Enforce + cascade on edit — `CardsController.EditCard` (`PUT cards/{cardId}`)

After `Mapper.Map(userCardDto, card)` and before `Update`:

- **Edited card is a `Ticket`** → after its own `ExpirationDate` is updated, **cascade**: set
  `ExpirationDate = card.ExpirationDate` on **all** of that user's `Type = Card` cards (including blocked
  ones — matches "all cards"). Save in the same unit of work.
- **Edited card is a `Card`** and the user has a governing ticket → **force**
  `card.ExpirationDate = ticket.ExpirationDate` (silently overwrite the submitted value). This is the
  backend guarantee behind the frontend's disabled edit control.

> Decision: silent overwrite (not `400`) — robust and idempotent; the frontend already blocks the edit,
> so a divergent value is anomalous and is simply normalised.

### B4. Placement

Logic stays **inline in the controllers + the new repository method**, matching the existing style of
`AssignUserToCard` / `EditCard`. (A dedicated `UserCardService` was considered but rejected as
unnecessary DI wiring for two call sites.)

### B5. Backend tests — extend `Tests/V1/Required2026FeaturesTest.cs`

1. **Assign under ticket forces expiration:** user with an active ticket (expiry T); assign a card
   sending a *different* expiration → response/persisted `ExpirationDate == T`.
2. **Edit ticket cascades:** change the ticket's expiration to T2 → every existing `Card` of the user now
   reports `ExpirationDate == T2`.
3. **Edit governed card is overwritten:** attempt to set a card's expiration to X while a ticket (expiry
   T) exists → persisted value is `T`, not `X`.
4. **No ticket = regression:** user without a ticket; assigned card keeps its own submitted expiration,
   and editing its expiration works as before.

## Frontend — `kredsys-frontend`

All changes are within `src/app/modules/admin/modules/user-info/`. The frontend mirrors the backend rule
but is **not** the source of truth — it only previews/reflects state and drives the ticket edit.

### F1. `UserInfoCardsComponent`

New derivations from `cards()` (governing-ticket rule identical to backend):

```ts
get activeTicket(): ICard | null        // non-blocked Type=Ticket, latest expiration, else null
get hasTicketExpiration(): boolean      // activeTicket != null && activeTicket.expirationDate != null
get physicalCards(): ICard[]            // cards().filter(c => c.type !== EUserCardType.TICKET)
```

- The `@for` chip loop iterates **`physicalCards`** (the ticket is rendered in its own section, F3).
- **`canAddCard`**: if `activeTicket` exists → `true` (ticket governs; multiple cards allowed). Otherwise
  the existing rule, evaluated over `physicalCards` only (`!some(active card with expiration)`).
- **`inheritedExpiration`**: unchanged, but ignores `Type = Ticket` cards. Only used when no ticket.
- **Chip expiration edit is disabled when `hasTicketExpiration`**: the per-row edit button is `disabled`
  with tooltip **"Expirace nastavena automaticky podle vstupenky"** (no dialog opens).

### F2. Assignment

`onAssignCard()` passes `expirationDate: activeTicket ? null : inheritedExpiration`. When a ticket exists
the backend fills the expiration; otherwise legacy inheritance applies.

### F3. New "Vstupenka" section (below the chips)

Rendered only when `activeTicket` exists. Shows the label **"Vstupenka"** (+ `user().ticketId` when
present), the ticket expiration (`dd.MM.yyyy HH:mm`, "(vypršela)" if past, "bez expirace" if null), and an
**edit** button. Editing opens `CardExpirationDialogComponent` in **cascade-warning** mode; on save it
calls `usersService.setUserCardExpiration(activeTicket, value)` (`PUT cards/{id}`) and emits `refresh` —
the **backend cascades** the new expiration to all chips, which then reload.

### F4. `CardExpirationDialogComponent`

Extend `ICardExpirationDialogData` with `cascadeWarning?: boolean`. When set: title "Expirace vstupenky"
and a prominent warning banner — *"Změna ovlivní expiraci všech čipů uživatele."*. Save/clear remain
active. (No "locked" mode is needed because governed chips disable the button instead of opening a dialog.)

### F5. Check-in

No change. `CheckInComponent` already assigns via `addUserCard(userId, newCard)` with no expiration, so the
backend (B2) sets it from the ticket.

### F6. Docs & tests

- `docs/types-enums.md`: drop the "Ticket not used on FE" note (now used).
- `docs/components.md`: update the `UserInfoCardsComponent` description (Vstupenka section, ticket-driven
  expiration, disabled edit, `canAddCard` exemption).
- Specs: `user-info-cards.component.spec.ts` (physicalCards filtering, `activeTicket`/`hasTicketExpiration`,
  `canAddCard` with ticket, assign passes `null` under a ticket, edit button disabled under
  ticket-with-expiration, Vstupenka section render) and `card-expiration-dialog.component.spec.ts`
  (cascade-warning mode renders the banner and keeps save active).

## Out of scope

- No DB migration. No new endpoints. No change to DTO shapes (`UserCardDto.Create/Edit/Read` already carry
  `Type` + `ExpirationDate`).
- Multi-ticket management UI. Blocked-ticket governance (a blocked ticket yields no governing ticket →
  legacy behaviour).

## Behaviour matrix

| User state | Assign new card | Edit chip expiration | Edit ticket expiration |
|---|---|---|---|
| No ticket | own/inherited expiration | allowed | n/a |
| Ticket w/ expiration | forced = ticket (BE) | **disabled** (FE) / forced (BE) | allowed → cascades (BE) |
| Ticket w/o expiration | forced = null (BE) | allowed (FE) / forced=null (BE) | allowed → cascades (BE) |
