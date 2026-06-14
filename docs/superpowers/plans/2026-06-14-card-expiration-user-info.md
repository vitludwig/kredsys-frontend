# Card Expiration in user-info — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show and edit each card's expiration (date+time) in user-info, block adding a new card while an active expiring card exists, and inherit the last-blocked card's expiration onto the next added card.

**Architecture:** Frontend-only. Extend `ICard` + `UsersService` with the already-existing backend card endpoints (assign / edit / block / unblock / delete). Add a small standalone `CardExpirationDialogComponent`. Put the guard + inheritance logic in `UserInfoCardsComponent`; wire the assign dialog to pass an inherited expiration.

**Tech Stack:** Angular 21 (standalone components, signal inputs), Angular Material, Jasmine + Karma, RxJS `firstValueFrom`.

**Spec:** `docs/superpowers/specs/2026-06-14-card-expiration-user-info-design.md`

**Backend contract (confirmed):**
- `POST users/{userId}/card` body `{ uid, type, description, expirationDate }`
- `PUT cards/{cardId}` body `{ type, description, expirationDate }` (maps whole DTO → must resend `type`+`description`; `type` validated non-null enum)
- `PUT cards/{cardId}/block` (no body) · `PUT cards/{cardId}/unblock` (no body)
- `DELETE cards/{cardId}` → **400** if referenced by historical transactions
- Validity: `!blocked && (expirationDate == null || expirationDate > now)`, server local time. Expiration treated as naive local (no `Z`).

**Run tests:** `ng test --watch=false` (single run). Build check: `yarn run build`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/app/common/types/ICard.ts` | `ICard` + `EUserCardType` enum | Modify |
| `src/app/modules/admin/services/users/users.service.ts` | card HTTP methods | Modify |
| `src/app/modules/admin/services/users/users.service.spec.ts` | service tests | Modify |
| `src/app/common/components/card-loader/card-loader.component.spec.ts` | enum literal fix | Modify |
| `src/app/modules/admin/modules/user-list/components/user-detail/user-detail.component.ts` | enum literal fix | Modify |
| `.../user-info/components/card-expiration-dialog/card-expiration-dialog.component.ts` (+`.html`, `.spec.ts`) | edit-expiration dialog | Create |
| `.../user-info/components/assign-card-dialog/assign-card-dialog.component.ts` | pass inherited expiration | Modify |
| `.../user-info/components/assign-card-dialog/assign-card-dialog.component.spec.ts` | dialog test | Create |
| `.../user-info/components/user-info-cards/user-info-cards.component.ts` | guard, inheritance, handlers | Modify |
| `.../user-info/components/user-info-cards/user-info-cards.component.html` | expiration UI + actions | Modify |
| `.../user-info/components/user-info-cards/user-info-cards.component.spec.ts` | component tests | Create |
| `docs/types-enums.md`, `docs/services.md`, `docs/components.md` | keep docs in sync | Modify |

---

## Task 1: `EUserCardType` enum + `ICard`, fix existing call sites

Introduce the enum and tighten `ICard.type`. Several existing files assign the `'Card'` string literal to an `ICard`-typed value; under `strict` they must be updated or the build breaks.

**Files:**
- Modify: `src/app/common/types/ICard.ts`
- Modify: `src/app/modules/admin/services/users/users.service.ts:148`
- Modify: `src/app/common/components/card-loader/card-loader.component.spec.ts:55-60`
- Modify: `src/app/modules/admin/modules/user-list/components/user-detail/user-detail.component.ts:144-148`

- [ ] **Step 1: Rewrite `ICard.ts`**

```ts
export enum EUserCardType {
	CARD = 'Card',
	TICKET = 'Ticket',
}

export interface ICard {
	id?: number; // card DB id
	uid?: number; // card device id
	description: string;
	type: EUserCardType;
	expirationDate?: string | null; // naive local ISO, e.g. "2026-12-31T23:59:00"; null = no expiration
	blocked?: boolean;
	userId?: number; // zatim je tu objekt uzivatele, Patrik by to mel zmenit jen na id
}
```

- [ ] **Step 2: Update `addUserCard` signature default in `users.service.ts`**

Change the method signature on line 148 only (body unchanged for now):

```ts
	public async addUserCard(userId: number, cardUid: number, description: string = '', type: EUserCardType = EUserCardType.CARD): Promise<ICard> {
```

Add to the imports at the top of `users.service.ts` (the file already imports `ICard` from that module):

```ts
import {ICard, EUserCardType} from '../../../../common/types/ICard';
```

- [ ] **Step 3: Fix `card-loader.component.spec.ts` mock cards**

The file already imports `ICard`; extend the import and replace the 4 literals:

```ts
import {ICard, EUserCardType} from '../../types/ICard';
```

```ts
	const mockCards: ICard[] = [
		{ uid: 1001, userId: 1, description: 'card1', type: EUserCardType.CARD },
		{ uid: 1002, userId: 2, description: 'card2', type: EUserCardType.CARD },
		{ uid: 1003, userId: 3, description: 'card3', type: EUserCardType.CARD },
		{ uid: 1004, userId: 1, description: 'card4', type: EUserCardType.CARD },
	];
```

(Adjust the import path/specifier to match the existing `ICard` import in that file if it differs.)

- [ ] **Step 4: Fix `user-detail.component.ts` `newCard` literal**

Add `EUserCardType` to the existing `ICard` import in that file, then change the literal:

```ts
		const newCard = {
			description: '',
			type: EUserCardType.CARD,
		};
```

- [ ] **Step 5: Run the build + tests to confirm green**

Run: `yarn run build`
Expected: build succeeds (no TS errors about `'Card'` not assignable to `EUserCardType`).

Run: `ng test --watch=false`
Expected: existing suites pass (note: `users.service.spec.ts` `addUserCard` "custom type" test still passes the string `'Bracelet'`; it is fixed in Task 2).

> If the build fails because `ng test` runs first, run the build last. If `users.service.spec.ts` fails to compile on `'Bracelet'`, proceed to Task 2 which fixes it; you may run Task 1 + Task 2 build/test together.

- [ ] **Step 6: Commit**

```bash
git add src/app/common/types/ICard.ts \
        src/app/modules/admin/services/users/users.service.ts \
        src/app/common/components/card-loader/card-loader.component.spec.ts \
        src/app/modules/admin/modules/user-list/components/user-detail/user-detail.component.ts
git commit -m "refactor(cards): introduce EUserCardType enum, type ICard.expirationDate as string|null"
```

---

## Task 2: `addUserCard` accepts `expirationDate`

**Files:**
- Modify: `src/app/modules/admin/services/users/users.service.ts:147-155`
- Test: `src/app/modules/admin/services/users/users.service.spec.ts:297-320`

- [ ] **Step 1: Update the `addUserCard` tests**

Replace the whole `describe('addUserCard', ...)` block (lines 297-320) with:

```ts
  describe('addUserCard', () => {
    it('should POST card with default type, description and null expiration', async () => {
      const promise = service.addUserCard(11, 99999);
      const req = httpMock.expectOne(API_URL + 'users/11/card');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        uid: 99999,
        type: 'Card',
        description: '',
        expirationDate: null,
      });
      req.flush({ id: 1, uid: 99999 });
      await promise;
    });

    it('should POST card with custom description and expiration', async () => {
      const promise = service.addUserCard(12, 88888, 'My card', EUserCardType.CARD, '2026-12-31T23:59:00');
      const req = httpMock.expectOne(API_URL + 'users/12/card');
      expect(req.request.body.description).toBe('My card');
      expect(req.request.body.expirationDate).toBe('2026-12-31T23:59:00');
      req.flush({ id: 2, uid: 88888 });
      await promise;
    });
  });
```

Add `EUserCardType` to the spec's `ICard` import:

```ts
import { ICard, EUserCardType } from '../../../../common/types/ICard';
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `ng test --watch=false`
Expected: FAIL — `addUserCard` does not yet accept a 5th `expirationDate` argument / sends hard-coded `null`.

- [ ] **Step 3: Implement**

Replace `addUserCard` (lines 147-155) with:

```ts
	@invalidateCache([ECacheTag.USER_CARDS])
	public async addUserCard(userId: number, cardUid: number, description: string = '', type: EUserCardType = EUserCardType.CARD, expirationDate: string | null = null): Promise<ICard> {
		return firstValueFrom(this.http.post<ICard>(this.configService.config.apiUrl + 'users/' + userId + '/card', {
			uid: cardUid,
			type: type,
			description: description,
			expirationDate: expirationDate,
		}));
	}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `ng test --watch=false`
Expected: PASS (both `addUserCard` tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/services/users/users.service.ts \
        src/app/modules/admin/services/users/users.service.spec.ts
git commit -m "feat(users-service): addUserCard accepts expirationDate"
```

---

## Task 3: `setUserCardExpiration`

**Files:**
- Modify: `src/app/modules/admin/services/users/users.service.ts` (add after `addUserCard`)
- Test: `src/app/modules/admin/services/users/users.service.spec.ts` (add new describe)

- [ ] **Step 1: Write the failing test**

Add after the `addUserCard` describe block:

```ts
  describe('setUserCardExpiration', () => {
    it('should PUT cards/{id} resending type and description', async () => {
      const card: ICard = { id: 7, uid: 555, description: 'Main', type: EUserCardType.CARD, blocked: false };
      const promise = service.setUserCardExpiration(card, '2026-12-31T23:59:00');
      const req = httpMock.expectOne(API_URL + 'cards/7');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        type: 'Card',
        description: 'Main',
        expirationDate: '2026-12-31T23:59:00',
      });
      req.flush({ ...card, expirationDate: '2026-12-31T23:59:00' });
      await promise;
    });

    it('should send empty description when card has none, and allow clearing expiration', async () => {
      const card: ICard = { id: 8, uid: 556, description: '', type: EUserCardType.CARD };
      const promise = service.setUserCardExpiration(card, null);
      const req = httpMock.expectOne(API_URL + 'cards/8');
      expect(req.request.body.expirationDate).toBeNull();
      expect(req.request.body.description).toBe('');
      expect(req.request.body.type).toBe('Card');
      req.flush({ ...card, expirationDate: null });
      await promise;
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `ng test --watch=false`
Expected: FAIL — `service.setUserCardExpiration is not a function`.

- [ ] **Step 3: Implement**

Add after `addUserCard` in `users.service.ts`:

```ts
	@invalidateCache([ECacheTag.USER_CARDS])
	public async setUserCardExpiration(card: ICard, expirationDate: string | null): Promise<ICard> {
		return firstValueFrom(this.http.put<ICard>(this.configService.config.apiUrl + 'cards/' + card.id, {
			type: card.type,
			description: card.description ?? '',
			expirationDate: expirationDate,
		}));
	}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `ng test --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/services/users/users.service.ts \
        src/app/modules/admin/services/users/users.service.spec.ts
git commit -m "feat(users-service): setUserCardExpiration via PUT cards/{id}"
```

---

## Task 4: `blockUserCard` / `unblockUserCard`

**Files:**
- Modify: `src/app/modules/admin/services/users/users.service.ts`
- Test: `src/app/modules/admin/services/users/users.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add a new describe block (next to `deleteUserCard`):

```ts
  describe('blockUserCard / unblockUserCard', () => {
    it('should PUT cards/{id}/block', async () => {
      const promise = service.blockUserCard(42);
      const req = httpMock.expectOne(API_URL + 'cards/42/block');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(null);
      await promise;
    });

    it('should PUT cards/{id}/unblock', async () => {
      const promise = service.unblockUserCard(42);
      const req = httpMock.expectOne(API_URL + 'cards/42/unblock');
      expect(req.request.method).toBe('PUT');
      req.flush(null);
      await promise;
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `ng test --watch=false`
Expected: FAIL — methods not defined.

- [ ] **Step 3: Implement**

Add before `deleteUserCard` in `users.service.ts`:

```ts
	@invalidateCache([ECacheTag.USER_CARDS])
	public blockUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + 'cards/' + id + '/block', null));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public unblockUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + 'cards/' + id + '/unblock', null));
	}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `ng test --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/services/users/users.service.ts \
        src/app/modules/admin/services/users/users.service.spec.ts
git commit -m "feat(users-service): block/unblock user card"
```

---

## Task 5: `CardExpirationDialogComponent`

A standalone dialog with a `datetime-local` input. Returns: an ISO string (save with value), `null` (clear expiration), or `undefined` (cancel).

**Files:**
- Create: `src/app/modules/admin/modules/user-info/components/card-expiration-dialog/card-expiration-dialog.component.ts`
- Create: `src/app/modules/admin/modules/user-info/components/card-expiration-dialog/card-expiration-dialog.component.html`
- Test: `src/app/modules/admin/modules/user-info/components/card-expiration-dialog/card-expiration-dialog.component.spec.ts`

- [ ] **Step 1: Write the component (with conversion helpers)**

`card-expiration-dialog.component.ts`:

```ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ICardExpirationDialogData {
	expirationDate: string | null;
}

@Component({
	selector: 'app-card-expiration-dialog',
	templateUrl: './card-expiration-dialog.component.html',
	standalone: true,
	imports: [FormsModule, MatDialogModule, MatButtonModule],
})
export class CardExpirationDialogComponent {
	private dialogRef = inject(MatDialogRef<CardExpirationDialogComponent>);
	private data: ICardExpirationDialogData = inject(MAT_DIALOG_DATA);

	// bound to <input type="datetime-local">, format "YYYY-MM-DDTHH:mm"
	protected value: string = this.toInputValue(this.data.expirationDate);

	protected onSave(): void {
		this.dialogRef.close(this.toIso(this.value));
	}

	protected onClear(): void {
		this.dialogRef.close(null);
	}

	protected onCancel(): void {
		this.dialogRef.close(undefined);
	}

	// stored ISO -> input value (local wall-clock "YYYY-MM-DDTHH:mm")
	private toInputValue(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	// input value -> naive local ISO with seconds, no timezone; '' -> null
	private toIso(input: string): string | null {
		if (!input) return null;
		return input.length === 16 ? `${input}:00` : input;
	}
}
```

- [ ] **Step 2: Write the template**

`card-expiration-dialog.component.html`:

```html
<h2 mat-dialog-title>Expirace karty</h2>

<div mat-dialog-content style="display:flex;flex-direction:column;gap:12px;padding-top:8px">
  <label style="display:flex;flex-direction:column;gap:4px">
    Platnost do
    <input type="datetime-local" [(ngModel)]="value" data-testid="expiration-input">
  </label>
</div>

<div mat-dialog-actions style="display:flex;justify-content:space-between;gap:8px">
  <button mat-button (click)="onClear()">Vymazat expiraci</button>
  <span style="display:flex;gap:8px">
    <button mat-button (click)="onCancel()">Zrušit</button>
    <button mat-raised-button color="primary" (click)="onSave()" data-testid="expiration-save">Uložit</button>
  </span>
</div>
```

- [ ] **Step 3: Write the spec**

`card-expiration-dialog.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CardExpirationDialogComponent } from './card-expiration-dialog.component';

describe('CardExpirationDialogComponent', () => {
  let fixture: ComponentFixture<CardExpirationDialogComponent>;
  let component: CardExpirationDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CardExpirationDialogComponent>>;

  function setup(expirationDate: string | null) {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [CardExpirationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { expirationDate } },
      ],
    });
    fixture = TestBed.createComponent(CardExpirationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('prefills the input from an ISO date', () => {
    setup('2026-12-31T23:59:00');
    expect((component as any).value).toBe('2026-12-31T23:59');
  });

  it('starts empty when no expiration', () => {
    setup(null);
    expect((component as any).value).toBe('');
  });

  it('save returns naive ISO string with seconds', () => {
    setup(null);
    (component as any).value = '2027-01-15T10:30';
    (component as any).onSave();
    expect(dialogRef.close).toHaveBeenCalledWith('2027-01-15T10:30:00');
  });

  it('save with empty value returns null', () => {
    setup('2026-12-31T23:59:00');
    (component as any).value = '';
    (component as any).onSave();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('clear returns null', () => {
    setup('2026-12-31T23:59:00');
    (component as any).onClear();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('cancel returns undefined', () => {
    setup('2026-12-31T23:59:00');
    (component as any).onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `ng test --watch=false`
Expected: PASS (6 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/modules/user-info/components/card-expiration-dialog/
git commit -m "feat(user-info): card expiration edit dialog"
```

---

## Task 6: `AssignCardDialogComponent` passes inherited expiration

**Files:**
- Modify: `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.ts`
- Test: `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.spec.ts` (create)

- [ ] **Step 1: Write the failing spec**

`assign-card-dialog.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssignCardDialogComponent } from './assign-card-dialog.component';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { EUserCardType } from '../../../../../../common/types/ICard';

describe('AssignCardDialogComponent', () => {
  let component: AssignCardDialogComponent;
  let fixture: ComponentFixture<AssignCardDialogComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AssignCardDialogComponent>>;

  function setup(expirationDate: string | null) {
    usersService = jasmine.createSpyObj('UsersService', ['addUserCard']);
    usersService.addUserCard.and.resolveTo({ id: 1, uid: 123, description: '', type: EUserCardType.CARD });
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [AssignCardDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: AlertService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 5, expirationDate } },
      ],
    });
    fixture = TestBed.createComponent(AssignCardDialogComponent);
    component = fixture.componentInstance;
  }

  it('forwards the inherited expiration to addUserCard', async () => {
    setup('2026-12-31T23:59:00');
    await (component as any).onCardLoaded(999);
    expect(usersService.addUserCard).toHaveBeenCalledWith(5, 999, '', EUserCardType.CARD, '2026-12-31T23:59:00');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('passes null expiration when none inherited', async () => {
    setup(null);
    await (component as any).onCardLoaded(888);
    expect(usersService.addUserCard).toHaveBeenCalledWith(5, 888, '', EUserCardType.CARD, null);
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `ng test --watch=false`
Expected: FAIL — `addUserCard` is called with 4 args (no expiration) and `data` has no `expirationDate`.

- [ ] **Step 3: Implement**

Edit `assign-card-dialog.component.ts`:

Add the import:

```ts
import { EUserCardType } from '../../../../../../common/types/ICard';
```

Change the `data` field type:

```ts
	private data: { userId: number; expirationDate: string | null } = inject(MAT_DIALOG_DATA);
```

Change the `addUserCard` call inside `onCardLoaded`:

```ts
			await this.usersService.addUserCard(this.data.userId, cardUid, '', EUserCardType.CARD, this.data.expirationDate);
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `ng test --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/modules/user-info/components/assign-card-dialog/
git commit -m "feat(user-info): assign-card dialog forwards inherited expiration"
```

---

## Task 7: `UserInfoCardsComponent` logic — guard, inheritance, handlers

**Files:**
- Modify: `src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.ts`
- Test: `src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.spec.ts` (create)

- [ ] **Step 1: Write the failing spec**

`user-info-cards.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { UserInfoCardsComponent } from './user-info-cards.component';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ICard, EUserCardType } from '../../../../../../common/types/ICard';
import { IUser } from '../../../../../../common/types/IUser';

describe('UserInfoCardsComponent', () => {
  let component: UserInfoCardsComponent;
  let fixture: ComponentFixture<UserInfoCardsComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let alertService: jasmine.SpyObj<AlertService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const user: IUser = { id: 5, name: 'X', email: 'x@x.cz', memberId: 1, roles: [], blocked: false };

  function card(p: Partial<ICard>): ICard {
    return { id: 1, uid: 1234, description: '', type: EUserCardType.CARD, blocked: false, expirationDate: null, ...p };
  }

  function setup(cards: ICard[]) {
    usersService = jasmine.createSpyObj('UsersService', ['deleteUserCard', 'blockUserCard', 'unblockUserCard', 'setUserCardExpiration']);
    usersService.deleteUserCard.and.resolveTo();
    usersService.blockUserCard.and.resolveTo();
    usersService.unblockUserCard.and.resolveTo();
    usersService.setUserCardExpiration.and.resolveTo(card({}));
    alertService = jasmine.createSpyObj('AlertService', ['success', 'error']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    TestBed.configureTestingModule({
      imports: [UserInfoCardsComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: AlertService, useValue: alertService },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    fixture = TestBed.createComponent(UserInfoCardsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', user);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();
  }

  function dialogReturns(value: unknown) {
    dialog.open.and.returnValue({ afterClosed: () => of(value) } as MatDialogRef<unknown>);
  }

  it('canAddCard is false when an active card has expiration', () => {
    setup([card({ blocked: false, expirationDate: '2026-12-31T23:59:00' })]);
    expect(component.canAddCard).toBe(false);
  });

  it('canAddCard is true when the only expiring card is blocked', () => {
    setup([card({ blocked: true, expirationDate: '2026-12-31T23:59:00' })]);
    expect(component.canAddCard).toBe(true);
  });

  it('canAddCard is true when cards have no expiration', () => {
    setup([card({ blocked: false, expirationDate: null })]);
    expect(component.canAddCard).toBe(true);
  });

  it('inheritedExpiration picks the highest-id blocked card with expiration', () => {
    setup([
      card({ id: 1, blocked: true, expirationDate: '2025-01-01T00:00:00' }),
      card({ id: 3, blocked: true, expirationDate: '2026-12-31T23:59:00' }),
      card({ id: 2, blocked: true, expirationDate: '2024-01-01T00:00:00' }),
    ]);
    expect(component.inheritedExpiration).toBe('2026-12-31T23:59:00');
  });

  it('inheritedExpiration is null when no blocked card carries expiration', () => {
    setup([card({ id: 1, blocked: false, expirationDate: '2026-12-31T23:59:00' })]);
    expect(component.inheritedExpiration).toBeNull();
  });

  it('isExpired is true for a past date', () => {
    setup([]);
    expect(component.isExpired(card({ expirationDate: '2000-01-01T00:00:00' }))).toBe(true);
    expect(component.isExpired(card({ expirationDate: null }))).toBe(false);
  });

  it('blocks a card after confirmation', async () => {
    setup([card({ id: 9, blocked: false })]);
    dialogReturns(true);
    const refreshSpy = spyOn(component.refresh, 'emit');
    await component.onBlockCard(card({ id: 9 }));
    expect(usersService.blockUserCard).toHaveBeenCalledWith(9);
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('does not block when confirmation is cancelled', async () => {
    setup([card({ id: 9 })]);
    dialogReturns(false);
    await component.onBlockCard(card({ id: 9 }));
    expect(usersService.blockUserCard).not.toHaveBeenCalled();
  });

  it('unblocks a card', async () => {
    setup([card({ id: 9, blocked: true })]);
    const refreshSpy = spyOn(component.refresh, 'emit');
    await component.onUnblockCard(card({ id: 9 }));
    expect(usersService.unblockUserCard).toHaveBeenCalledWith(9);
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('edits expiration when dialog returns a value', async () => {
    const c = card({ id: 9, expirationDate: null });
    setup([c]);
    dialogReturns('2027-01-01T12:00:00');
    const refreshSpy = spyOn(component.refresh, 'emit');
    await component.onEditExpiration(c);
    expect(usersService.setUserCardExpiration).toHaveBeenCalledWith(c, '2027-01-01T12:00:00');
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('clears expiration when dialog returns null', async () => {
    const c = card({ id: 9, expirationDate: '2027-01-01T12:00:00' });
    setup([c]);
    dialogReturns(null);
    await component.onEditExpiration(c);
    expect(usersService.setUserCardExpiration).toHaveBeenCalledWith(c, null);
  });

  it('does nothing when expiration dialog is cancelled', async () => {
    const c = card({ id: 9 });
    setup([c]);
    dialogReturns(undefined);
    await component.onEditExpiration(c);
    expect(usersService.setUserCardExpiration).not.toHaveBeenCalled();
  });

  it('shows a specific error when delete fails with 400', async () => {
    const c = card({ id: 9 });
    setup([c]);
    dialogReturns(true);
    usersService.deleteUserCard.and.rejectWith(new HttpErrorResponse({ status: 400 }));
    await component.onDeleteCard(c);
    expect(alertService.error).toHaveBeenCalledWith('Kartu nelze smazat — je použita v transakcích');
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `ng test --watch=false`
Expected: FAIL — `canAddCard`, `inheritedExpiration`, `isExpired`, `onBlockCard`, `onUnblockCard`, `onEditExpiration`, `onDeleteCard` not defined.

- [ ] **Step 3: Implement the component**

Replace the body of `user-info-cards.component.ts` with:

```ts
import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICard } from '../../../../../../common/types/ICard';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';
import { CardExpirationDialogComponent } from '../card-expiration-dialog/card-expiration-dialog.component';

@Component({
	selector: 'app-user-info-cards',
	templateUrl: './user-info-cards.component.html',
	styleUrls: ['./user-info-cards.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
		DatePipe,
	],
})
export class UserInfoCardsComponent {
	user = input.required<IUser>();
	cards = input<ICard[]>([]);

	refresh = output<void>();

	private dialog = inject(MatDialog);
	private usersService = inject(UsersService);
	private alertService = inject(AlertService);

	// Adding is blocked while an active (non-blocked) card carries an expiration.
	public get canAddCard(): boolean {
		return !this.cards().some(c => !c.blocked && c.expirationDate != null);
	}

	// Expiration of the most recently blocked card carrying one (highest id; ICard has no blockedAt).
	public get inheritedExpiration(): string | null {
		return this.cards()
			.filter(c => c.blocked && c.expirationDate != null)
			.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]?.expirationDate ?? null;
	}

	public isExpired(card: ICard): boolean {
		return card.expirationDate != null && new Date(card.expirationDate).getTime() <= Date.now();
	}

	protected last4(uid: number | null | undefined): string {
		return uid == null ? '—' : String(uid).slice(-4);
	}

	protected async onAssignCard(): Promise<void> {
		const userId = this.user().id;
		if (userId == null) return;
		const ref = this.dialog.open(AssignCardDialogComponent, {
			width: '420px',
			data: { userId, expirationDate: this.inheritedExpiration },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result) this.refresh.emit();
	}

	public async onEditExpiration(card: ICard): Promise<void> {
		const ref = this.dialog.open(CardExpirationDialogComponent, {
			width: '360px',
			data: { expirationDate: card.expirationDate ?? null },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result === undefined) return; // cancelled
		try {
			await this.usersService.setUserCardExpiration(card, result as string | null);
			this.alertService.success('Expirace uložena');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při ukládání expirace');
		}
	}

	public async onBlockCard(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: { title: 'Zablokovat kartu', text: 'Opravdu zablokovat kartu?' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.blockUserCard(card.id!);
			this.alertService.success('Karta zablokována');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při blokování karty');
		}
	}

	public async onUnblockCard(card: ICard): Promise<void> {
		try {
			await this.usersService.unblockUserCard(card.id!);
			this.alertService.success('Karta odblokována');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při odblokování karty');
		}
	}

	public async onDeleteCard(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: { title: 'Smazat kartu', text: 'Opravdu smazat kartu? Tuto akci nelze vrátit.' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.deleteUserCard(card.id!);
			this.alertService.success('Karta smazána');
			this.refresh.emit();
		} catch (e) {
			if (e instanceof HttpErrorResponse && e.status === 400) {
				this.alertService.error('Kartu nelze smazat — je použita v transakcích');
			} else {
				this.alertService.error('Chyba při mazání karty');
			}
		}
	}
}
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `ng test --watch=false`
Expected: PASS (all `UserInfoCardsComponent` specs).

> Note: the template still references the old `onToggleCardBlocked` until Task 8. The component compiles because `templateUrl` is checked at build; if `yarn run build` is run now it will fail on the missing method. Run only `ng test` here; the template is fixed in Task 8 and the build is verified there.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.ts \
        src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.spec.ts
git commit -m "feat(user-info): card expiration guard, inheritance and block/edit/delete handlers"
```

---

## Task 8: `UserInfoCardsComponent` template — expiration UI + actions

**Files:**
- Modify: `src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.html`
- Modify: `src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.scss` (optional styling for expired)

- [ ] **Step 1: Replace the template**

`user-info-cards.component.html`:

```html
<div class="uid__section">
  <div class="uid__section-header">
    <h3>Karty</h3>
    <button mat-raised-button (click)="onAssignCard()" [disabled]="!canAddCard"
            [matTooltip]="canAddCard ? '' : 'Nejdřív zablokuj stávající kartu s expirací.'"
            [matTooltipDisabled]="canAddCard">
      <mat-icon>add</mat-icon>
      Přiřadit kartu
    </button>
  </div>
  @if (cards().length === 0) {
    <p class="uid__empty">Žádné karty</p>
  }
  @for (card of cards(); track card.id) {
    <div class="uid__card-row">
      <span class="uid__card-uid">...{{ last4(card.uid) }}</span>
      <span class="uid__card-status">
        @if (card.blocked) {
          <span class="uid__badge--blocked">Zablokována</span>
        } @else {
          <span class="uid__badge--active">Aktivní</span>
        }
      </span>
      <span class="uid__card-expiration" [class.uid__card-expiration--expired]="isExpired(card)">
        @if (card.expirationDate) {
          {{ card.expirationDate | date:'dd.MM.yyyy HH:mm' }}
          @if (isExpired(card)) { <span>(vypršela)</span> }
        } @else {
          bez expirace
        }
      </span>
      <button mat-icon-button (click)="onEditExpiration(card)" aria-label="Změnit expiraci" matTooltip="Změnit expiraci">
        <mat-icon>edit_calendar</mat-icon>
      </button>
      @if (card.blocked) {
        <button mat-button (click)="onUnblockCard(card)">Odblokovat</button>
      } @else {
        <button mat-button (click)="onBlockCard(card)">Zablokovat</button>
      }
      <button mat-icon-button (click)="onDeleteCard(card)" aria-label="Smazat kartu" matTooltip="Smazat kartu">
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  }
</div>
```

- [ ] **Step 2: (Optional) add expired styling**

Append to `user-info-cards.component.scss`:

```scss
.uid__card-expiration--expired {
  color: var(--mat-sys-error, #b00020);
  font-weight: 600;
}
```

- [ ] **Step 3: Build + run the full suite**

Run: `yarn run build`
Expected: build succeeds (template now matches the component API; no reference to the removed `onToggleCardBlocked`).

Run: `ng test --watch=false`
Expected: PASS across the whole suite.

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.html \
        src/app/modules/admin/modules/user-info/components/user-info-cards/user-info-cards.component.scss
git commit -m "feat(user-info): card row shows expiration, edit/block/unblock/delete actions, guarded add"
```

---

## Task 9: Sync docs

Keep the codebase docs accurate (CLAUDE.md mandates reading them before changes).

**Files:**
- Modify: `docs/types-enums.md`
- Modify: `docs/services.md`
- Modify: `docs/components.md`

- [ ] **Step 1: `types-enums.md`** — under "Core entities" add the `ICard` / `EUserCardType` shapes:

```markdown
interface ICard {
  id?: number;
  uid?: number;
  description: string;
  type: EUserCardType;
  expirationDate?: string | null;   // naive local ISO; null = no expiration
  blocked?: boolean;
  userId?: number;
}

enum EUserCardType { CARD = 'Card', TICKET = 'Ticket' }   // Ticket not used on FE
```

- [ ] **Step 2: `services.md`** — replace the `UsersService` card lines with the full set:

```markdown
getUserCards(id): Promise<IPaginatedResponse<ICard>>            // @cache USER_CARDS
addUserCard(userId, uid, description?, type?, expirationDate?): Promise<ICard>  // @invalidateCache
setUserCardExpiration(card, expirationDate): Promise<ICard>     // PUT cards/{id}, resends type+description
blockUserCard(id): Promise<void>                               // PUT cards/{id}/block
unblockUserCard(id): Promise<void>                             // PUT cards/{id}/unblock
deleteUserCard(id): Promise<void>                             // DELETE cards/{id}; 400 if used by transactions
```

- [ ] **Step 3: `components.md`** — update the `user-info` cards entry. Find the user-info section (under Admin Module) and add:

```markdown
### `UserInfoCardsComponent` — `app-user-info-cards`
Card list per user. Shows UID last-4, Active/Blocked badge, expiration (date+time, "vypršela" if past).
Actions: edit expiration (`CardExpirationDialogComponent`), block/unblock, delete.
"Přiřadit kartu" is disabled while an active card carries an expiration; a newly assigned card
inherits the last-blocked card's expiration.
```

- [ ] **Step 4: Commit**

```bash
git add docs/types-enums.md docs/services.md docs/components.md
git commit -m "docs: reflect card expiration methods, EUserCardType, user-info cards behavior"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** display expiration → Task 8; edit expiration → Tasks 3,5,7,8; add-guard → Tasks 7,8; inheritance → Tasks 6,7; BE methods → Tasks 2,3,4; date+time wall-clock → Task 5; enum → Task 1; tests → every task; docs → Task 9. No gaps.
- **Placeholder scan:** none — every code step shows full code.
- **Type consistency:** `EUserCardType` (CARD/TICKET); `ICard.expirationDate: string | null`; `setUserCardExpiration(card, expirationDate)`; dialog returns `string | null | undefined`; `addUserCard(userId, uid, description, type, expirationDate)` used identically in Tasks 2 & 6. `canAddCard`/`inheritedExpiration`/`isExpired`/`onBlockCard`/`onUnblockCard`/`onEditExpiration`/`onDeleteCard` defined in Task 7 and consumed in Task 8 with matching names.

## Note on ordering

Task 7 changes the component class but the template (Task 8) still references the old `onToggleCardBlocked` until Task 8 lands. Run `ng test` (not `yarn build`) at the end of Task 7; run the full build at Task 8. If you prefer a green build at every commit, do Tasks 7 and 8 as one commit.
```
