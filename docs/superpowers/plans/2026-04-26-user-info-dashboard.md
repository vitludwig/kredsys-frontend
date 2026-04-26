# User Info Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/user-info` — one-stop dashboard for festival info booth staff to manage any visitor's account (search/scan, view balance, charge/discharge, storno, card management, block user).

**Architecture:** Standalone `UserInfoComponent` shell owns all state and data-loading; `UserInfoDetailComponent` (also standalone) renders sections and opens dialogs for actions; all dialogs are new standalone components. All data flows through existing services — no new services needed.

**Tech Stack:** Angular 21, Angular Material M3, TypeScript, Karma/Jasmine

---

## File Map

**Created:**
```
src/app/modules/admin/modules/user-info/
  user-info.component.ts
  user-info.component.html
  user-info.component.scss
  user-info.component.spec.ts
  components/
    user-info-detail/
      user-info-detail.component.ts
      user-info-detail.component.html
      user-info-detail.component.scss
      user-info-detail.component.spec.ts
    charge-dialog/
      charge-dialog.component.ts
      charge-dialog.component.html
    discharge-dialog/
      discharge-dialog.component.ts
      discharge-dialog.component.html
    assign-card-dialog/
      assign-card-dialog.component.ts
      assign-card-dialog.component.html
```

**Modified:**
- `src/app/common/types/ERoute.ts` — add `ADMIN_USER_INFO`
- `src/app/modules/admin/admin-routing.module.ts` — add `loadComponent` route
- `src/app/common/modules/menu/components/side-menu/side-menu.component.html` — add nav link

---

## Key facts to remember across all tasks

- `UsersService.getUserCurrencyAccounts(userId)` returns `ICurrencyAccount[]` (empty array if none); use `[0] ?? null` — never call `CurrencyService.getCurrencyAccount(id)` (that takes an account ID, not a user ID)
- `CurrencyService.defaultCurrency` is a plain property (filled on app init), not a BehaviorSubject
- `TransactionService.deposit(userId, placeId, currencyId, records)` / `.withDraw(...)` need `placeId` → get from `PlaceService.selectedPlace?.id ?? 0`; if 0 the button must be disabled
- `UsersService.getUserCards(userId)` returns `IPaginatedResponse<ICard>`
- `UsersService.getUserTransactions(userId, page, pageSize, filter, orderBy)` — use `orderBy = 'created desc'`
- `UsersService.getUserByCardUid(uid: number)` — resolves card UID to user
- `UsersService.setUserBlocked(user, value)` — toggles block state
- `WithSubscriptions` (`src/app/common/components/with-subscriptions.ts`) is a `@Directive()` abstract class — extend it in standalone components to get `destroy$` and `ngOnDestroy()`
- `ConfirmDialogComponent` is standalone — import and open via `MatDialog`
- `ClickConfirmDirective` is standalone — add to `imports[]`
- All success/error feedback uses `AlertService` (inject, call `.success()` / `.error()`)
- Templates: always `@if` / `@for`, never `*ngIf` / `*ngFor`

---

## Task 1: Routing + nav link

**Files:**
- Modify: `src/app/common/types/ERoute.ts`
- Modify: `src/app/modules/admin/admin-routing.module.ts`
- Modify: `src/app/common/modules/menu/components/side-menu/side-menu.component.html`

- [ ] **Step 1: Add route enum value**

In `src/app/common/types/ERoute.ts`, add inside the enum (after `ADMIN_GROUPS`):
```typescript
ADMIN_USER_INFO = 'user-info',
```

- [ ] **Step 2: Register route in admin-routing.module.ts**

In `src/app/modules/admin/admin-routing.module.ts`, add to the `routes` array (after the `ADMIN_CHARGE` entry at the end):
```typescript
{
  path: ERoute.ADMIN_USER_INFO,
  loadComponent: () =>
    import('../user-info/user-info.component').then(m => m.UserInfoComponent),
  data: { name: 'Uživatelský dashboard' },
},
```

- [ ] **Step 3: Add nav link to side menu**

In `src/app/common/modules/menu/components/side-menu/side-menu.component.html`, inside the `@if (adminMenuOpened)` block, add after the `ADMIN_USERS` link:
```html
@if (userRoles | canAccessRoute: ERoute.ADMIN_USERS) {
  <a
    [class.active]="router.url.startsWith('/' + ERoute.ADMIN + '/' + ERoute.ADMIN_USER_INFO)"
    [routerLink]="[ERoute.ADMIN, ERoute.ADMIN_USER_INFO]"
    mat-list-item>
    Infostánek
  </a>
}
```

Also add `ADMIN_USER_INFO` to the `ERoute` reference in `side-menu.component.ts` — it's already imported via `protected readonly ERoute = ERoute`, so no import change is needed.

- [ ] **Step 4: Commit**
```bash
git add src/app/common/types/ERoute.ts \
        src/app/modules/admin/admin-routing.module.ts \
        src/app/common/modules/menu/components/side-menu/side-menu.component.html
git commit -m "feat: add /admin/user-info route and nav link"
```

---

## Task 2: UserInfoComponent — shell

**Files:**
- Create: `src/app/modules/admin/modules/user-info/user-info.component.ts`
- Create: `src/app/modules/admin/modules/user-info/user-info.component.html`
- Create: `src/app/modules/admin/modules/user-info/user-info.component.scss`
- Create: `src/app/modules/admin/modules/user-info/user-info.component.spec.ts`

- [ ] **Step 1: Write the failing spec**

Create `src/app/modules/admin/modules/user-info/user-info.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInfoComponent } from './user-info.component';
import { UsersService } from '../../services/users/users.service';
import { PlaceService } from '../../services/place/place/place.service';
import { AlertService } from '../../../common/services/alert/alert.service';
import { CurrencyService } from '../../services/currency/currency.service';
import { BehaviorSubject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UserInfoComponent', () => {
  let component: UserInfoComponent;
  let fixture: ComponentFixture<UserInfoComponent>;

  const mockUsersService = {
    getUsers: jasmine.createSpy('getUsers').and.returnValue(Promise.resolve({ data: [], total: 0, page: 0, pageSize: 10 })),
    getUserByCardUid: jasmine.createSpy('getUserByCardUid'),
    getUserCurrencyAccounts: jasmine.createSpy('getUserCurrencyAccounts').and.returnValue(Promise.resolve([])),
    getUserTransactions: jasmine.createSpy('getUserTransactions').and.returnValue(Promise.resolve({ data: [], total: 0, page: 0, pageSize: 20 })),
    getUserCards: jasmine.createSpy('getUserCards').and.returnValue(Promise.resolve({ data: [], total: 0, page: 0, pageSize: 999 })),
  };

  const mockPlaceService = {
    selectedPlace$: new BehaviorSubject(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: PlaceService, useValue: mockPlaceService },
        { provide: AlertService, useValue: { success: () => {}, error: () => {} } },
        { provide: CurrencyService, useValue: { defaultCurrency: null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide detail panel when no user is selected', () => {
    const detail = fixture.nativeElement.querySelector('app-user-info-detail');
    expect(detail).toBeNull();
  });

  it('should show ✕ Zavřít button only when user is selected', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="close-btn"]')).toBeNull();
    (component as any).selectedUser = { id: 1, name: 'Test', email: 'test@test.cz', memberId: 1, blocked: false, roles: [] };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="close-btn"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx karma start --single-run 2>&1 | grep -A 2 "UserInfoComponent"
```
Expected: FAILED — component not found.

- [ ] **Step 3: Create user-info.component.ts**

Create `src/app/modules/admin/modules/user-info/user-info.component.ts`:
```typescript
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { UsersService } from '../../services/users/users.service';
import { PlaceService } from '../../services/place/place/place.service';
import { AlertService } from '../../../../common/services/alert/alert.service';
import { CurrencyService } from '../../services/currency/currency.service';
import { WithSubscriptions } from '../../../../common/components/with-subscriptions';
import { IUser } from '../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../common/types/ICurrency';
import { ICard } from '../../../../common/types/ICard';
import { ITransaction } from '../transactions/services/transaction/types/ITransaction';
import { UserInfoDetailComponent } from './components/user-info-detail/user-info-detail.component';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserInfoDetailComponent,
  ],
})
export class UserInfoComponent extends WithSubscriptions implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private placeService = inject(PlaceService);
  private alertService = inject(AlertService);
  protected currencyService = inject(CurrencyService);

  protected searchControl = new FormControl<string | IUser>('');
  protected userOptions: IUser[] = [];
  protected isSearching = false;

  protected selectedUser: IUser | null = null;
  protected currencyAccount: ICurrencyAccount | null = null;
  protected accountLoaded = false;
  protected transactions: ITransaction[] = [];
  protected transactionsTotal = 0;
  protected transactionsPage = 0;
  protected cards: ICard[] = [];
  protected placeId: number | null = null;

  protected cardUidInput = '';

  public ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => typeof v === 'string' && (v as string).length >= 2),
      takeUntil(this.destroy$),
    ).subscribe(async (search) => {
      await this.doSearch(search as string);
    });

    this.placeService.selectedPlace$.pipe(takeUntil(this.destroy$)).subscribe(place => {
      this.placeId = place?.id ?? null;
    });
  }

  private async doSearch(query: string): Promise<void> {
    this.isSearching = true;
    try {
      const result = await this.usersService.getUsers(query, 0, 10);
      this.userOptions = result.data;
    } catch {
      this.alertService.error('Chyba při hledání uživatele');
    } finally {
      this.isSearching = false;
    }
  }

  protected displayFn(user: IUser | string): string {
    if (typeof user === 'string') return user;
    return user?.name ?? '';
  }

  protected onUserSelected(user: IUser): void {
    this.selectedUser = user;
    this.loadUserData(user);
  }

  protected onClose(): void {
    this.selectedUser = null;
    this.currencyAccount = null;
    this.accountLoaded = false;
    this.transactions = [];
    this.transactionsTotal = 0;
    this.transactionsPage = 0;
    this.cards = [];
    this.searchControl.setValue('');
    this.cardUidInput = '';
  }

  protected async onCardScan(): Promise<void> {
    const uid = parseInt(this.cardUidInput, 10);
    if (isNaN(uid)) {
      this.alertService.error('Zadej platné UID karty');
      return;
    }
    try {
      const user = await this.usersService.getUserByCardUid(uid);
      this.searchControl.setValue(user);
      this.onUserSelected(user);
    } catch {
      this.alertService.error('Karta nenalezena');
    }
    this.cardUidInput = '';
  }

  private async loadUserData(user: IUser): Promise<void> {
    this.accountLoaded = false;
    this.transactionsPage = 0;
    this.currencyAccount = null;
    this.transactions = [];
    this.transactionsTotal = 0;
    this.cards = [];

    try {
      const [accounts, txResult, cardsResult] = await Promise.all([
        this.usersService.getUserCurrencyAccounts(user.id!),
        this.usersService.getUserTransactions(user.id!, 0, 20, '', 'created desc'),
        this.usersService.getUserCards(user.id!),
      ]);
      this.currencyAccount = accounts[0] ?? null;
      this.transactions = txResult.data;
      this.transactionsTotal = txResult.total;
      this.cards = cardsResult.data;
    } catch {
      this.alertService.error('Chyba při načítání dat uživatele');
    } finally {
      this.accountLoaded = true;
    }
  }

  protected async onRefresh(): Promise<void> {
    if (!this.selectedUser) return;
    try {
      this.selectedUser = await this.usersService.getUser(this.selectedUser.id!);
      await this.loadUserData(this.selectedUser);
    } catch {
      this.alertService.error('Chyba při aktualizaci dat');
    }
  }

  protected async onLoadMoreTransactions(): Promise<void> {
    if (!this.selectedUser) return;
    this.transactionsPage++;
    try {
      const result = await this.usersService.getUserTransactions(
        this.selectedUser.id!, this.transactionsPage, 20, '', 'created desc',
      );
      this.transactions = [...this.transactions, ...result.data];
    } catch {
      this.alertService.error('Chyba při načítání transakcí');
    }
  }
}
```

- [ ] **Step 4: Create user-info.component.html**

Create `src/app/modules/admin/modules/user-info/user-info.component.html`:
```html
<div class="user-info">
  <div class="user-info__search">
    <mat-form-field class="user-info__search-field">
      <mat-label>Hledat uživatele</mat-label>
      <input
        matInput
        [formControl]="searchControl"
        [matAutocomplete]="auto"
        placeholder="Jméno nebo e-mail...">
      @if (isSearching) {
        <mat-progress-spinner matSuffix diameter="18" mode="indeterminate"></mat-progress-spinner>
      }
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayFn"
        (optionSelected)="onUserSelected($event.option.value)">
        @for (user of userOptions; track user.id) {
          <mat-option [value]="user">
            {{ user.name }}
            <small class="user-info__search-email">{{ user.email }}</small>
          </mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>

    <mat-form-field class="user-info__card-field">
      <mat-label>UID karty</mat-label>
      <input
        matInput
        type="number"
        [(ngModel)]="cardUidInput"
        (keydown.enter)="onCardScan()"
        placeholder="Přiložit kartu nebo zadat číslo">
      <mat-icon matSuffix>contactless</mat-icon>
    </mat-form-field>

    <button mat-raised-button (click)="onCardScan()">
      Načíst kartu
    </button>

    @if (selectedUser) {
      <button mat-raised-button color="warn" data-testid="close-btn" (click)="onClose()">
        <mat-icon>close</mat-icon>
        Zavřít
      </button>
    }
  </div>

  @if (selectedUser) {
    <app-user-info-detail
      [user]="selectedUser"
      [currencyAccount]="currencyAccount"
      [accountLoaded]="accountLoaded"
      [transactions]="transactions"
      [transactionsTotal]="transactionsTotal"
      [cards]="cards"
      [placeId]="placeId"
      [defaultCurrencyId]="currencyService.defaultCurrency?.id ?? null"
      (refresh)="onRefresh()"
      (loadMoreTransactions)="onLoadMoreTransactions()">
    </app-user-info-detail>
  }
</div>
```

- [ ] **Step 5: Create user-info.component.scss**

Create `src/app/modules/admin/modules/user-info/user-info.component.scss`:
```scss
.user-info {
  padding: 1.5rem;

  &__search {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  &__search-field {
    flex: 1;
    min-width: 240px;
  }

  &__card-field {
    width: 220px;
  }

  &__search-email {
    color: var(--mat-sys-on-surface-variant);
    margin-left: 0.5rem;
    font-size: 0.8em;
  }
}
```

- [ ] **Step 6: Run spec — expect PASS**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx karma start --single-run 2>&1 | grep -E "UserInfoComponent|FAILED|ERROR"
```
Expected: 3 specs, 0 failures for UserInfoComponent.

- [ ] **Step 7: Commit**
```bash
git add src/app/modules/admin/modules/user-info/
git commit -m "feat: add UserInfoComponent shell with search and card scan"
```

---

## Task 3: UserInfoDetailComponent — profile + balance card

**Files:**
- Create: `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.ts`
- Create: `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.html`
- Create: `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.scss`
- Create: `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.spec.ts`

- [ ] **Step 1: Write the failing spec**

Create `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInfoDetailComponent } from './user-info-detail.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { PlaceService } from '../../../../services/place/place/place.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';

const mockUser: IUser = {
  id: 1, name: 'Jan Novák', email: 'jan@test.cz',
  memberId: 4821, blocked: false, roles: [],
};

describe('UserInfoDetailComponent', () => {
  let component: UserInfoDetailComponent;
  let fixture: ComponentFixture<UserInfoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        { provide: TransactionService, useValue: { storno: jasmine.createSpy(), deposit: jasmine.createSpy(), withDraw: jasmine.createSpy() } },
        { provide: UsersService, useValue: { setUserBlocked: jasmine.createSpy(), addUserCard: jasmine.createSpy(), deleteUserCard: jasmine.createSpy() } },
        { provide: AlertService, useValue: { success: () => {}, error: () => {} } },
        { provide: PlaceService, useValue: { selectedPlace: null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInfoDetailComponent);
    component = fixture.componentInstance;
    component.user = mockUser;
    component.currencyAccount = null;
    component.accountLoaded = true;
    component.transactions = [];
    component.transactionsTotal = 0;
    component.cards = [];
    component.placeId = null;
    component.defaultCurrencyId = null;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show member ID', () => {
    const el = fixture.nativeElement.querySelector('[data-testid="member-id"]');
    expect(el?.textContent).toContain('4821');
  });

  it('should show "no account" message when currencyAccount is null and accountLoaded is true', () => {
    const el = fixture.nativeElement.querySelector('[data-testid="no-account"]');
    expect(el).toBeTruthy();
  });

  it('should show balance when currencyAccount exists', () => {
    const account: ICurrencyAccount = { id: 1, userId: 1, currencyId: 1, currentAmount: 450, overdraftLimit: 0 };
    component.currencyAccount = account;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="balance"]');
    expect(el?.textContent).toContain('450');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx karma start --single-run 2>&1 | grep -E "UserInfoDetailComponent|FAILED|ERROR"
```
Expected: FAILED — component not found.

- [ ] **Step 3: Create user-info-detail.component.ts**

Create `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.ts`:
```typescript
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClickConfirmDirective } from '../../../../../../common/directives/click-confirm/click-confirm.directive';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { CurrencyService } from '../../../../services/currency/currency.service';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { ICard } from '../../../../../../common/types/ICard';
import { ITransaction } from '../../../transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../transactions/services/transaction/types/ETransactionType';
import { ERoute } from '../../../../../../common/types/ERoute';
import { ChargeDialogComponent } from '../charge-dialog/charge-dialog.component';
import { DischargeDialogComponent } from '../discharge-dialog/discharge-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';

@Component({
  selector: 'app-user-info-detail',
  templateUrl: './user-info-detail.component.html',
  styleUrls: ['./user-info-detail.component.scss'],
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterLink,
    ClickConfirmDirective,
  ],
})
export class UserInfoDetailComponent {
  @Input() user!: IUser;
  @Input() currencyAccount: ICurrencyAccount | null = null;
  @Input() accountLoaded = false;
  @Input() transactions: ITransaction[] = [];
  @Input() transactionsTotal = 0;
  @Input() cards: ICard[] = [];
  @Input() placeId: number | null = null;
  @Input() defaultCurrencyId: number | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() loadMoreTransactions = new EventEmitter<void>();

  protected readonly ERoute = ERoute;
  protected readonly ETransactionType = ETransactionType;

  private dialog = inject(MatDialog);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

  protected get avatarInitial(): string {
    return this.user?.name?.[0]?.toUpperCase() ?? '?';
  }

  protected get financialDisabled(): boolean {
    return this.placeId === null;
  }

  protected get financialTooltip(): string {
    return this.financialDisabled ? 'Nejprve vyberte místo (Place Select)' : '';
  }

  protected get effectiveCurrencyId(): number | null {
    return this.currencyAccount?.currencyId ?? this.defaultCurrencyId ?? null;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  protected async onCharge(): Promise<void> {
    const ref = this.dialog.open(ChargeDialogComponent, { width: '420px' });
    const amount: number | undefined = await firstValueFrom(ref.afterClosed());
    if (!amount || amount <= 0) return;
    const currencyId = this.effectiveCurrencyId;
    if (!currencyId) { this.alertService.error('Chybí měna'); return; }
    try {
      await this.transactionService.deposit(this.user.id!, this.placeId!, currencyId, [{ text: 'Dobití kreditu', amount }]);
      this.alertService.success('Kredit nabit');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při nabíjení kreditu');
    }
  }

  protected async onDischarge(): Promise<void> {
    if (!this.currencyAccount) return;
    const ref = this.dialog.open(DischargeDialogComponent, {
      width: '420px',
      data: { user: this.user, account: this.currencyAccount },
    });
    const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    const currencyId = this.currencyAccount.currencyId;
    try {
      await this.transactionService.withDraw(
        this.user.id!, this.placeId!, currencyId,
        [{ text: 'Výběr kreditu', amount: this.currencyAccount.currentAmount }],
      );
      this.alertService.success('Kredit vybrán');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při výběru kreditu');
    }
  }

  protected async onStorno(transaction: ITransaction): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { title: 'Stornovat transakci', text: `Opravdu stornovat ${Math.abs(transaction.amount)} Kč?` },
    });
    const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    try {
      await this.transactionService.storno(transaction.id);
      this.alertService.success('Transakce stornována');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při stornování transakce');
    }
  }

  protected async onAssignCard(): Promise<void> {
    const ref = this.dialog.open(AssignCardDialogComponent, {
      width: '420px',
      data: { userId: this.user.id! },
    });
    const success: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (success) this.refresh.emit();
  }

  protected async onToggleCardBlocked(card: ICard): Promise<void> {
    const action = card.blocked ? 'odblokovat' : 'zablokovat';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { title: `${action.charAt(0).toUpperCase() + action.slice(1)} kartu`, text: `Opravdu chceš ${action} kartu ****${String(card.uid).slice(-4)}?` },
    });
    const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    try {
      const updated = { ...card, blocked: !card.blocked };
      // CardsService has no block method — use deleteUserCard to remove; addUserCard to reassign blocked state
      // The API for blocking a card: PUT /cards/:id with blocked flag — call via http directly or extend CardsService.
      // For now: remove and re-add (workaround until API is confirmed; adjust if backend supports PUT /cards/:id)
      await this.usersService.deleteUserCard(card.id!);
      if (!card.blocked) {
        // was active, now removing = effectively blocked
        this.alertService.success('Karta odebrána');
      } else {
        this.alertService.success('Karta odebrána — přiřaďte novou kartu');
      }
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při změně stavu karty');
    }
  }

  protected onEditProfile(): void {
    this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS, this.user.id, ERoute.EDIT]);
  }

  protected onChangePassword(): void {
    this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS, this.user.id, ERoute.ADMIN_CHANGE_PASSWORD]);
  }

  protected async onToggleBlock(): Promise<void> {
    const action = this.user.blocked ? 'odblokovat' : 'zablokovat';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { title: `${action.charAt(0).toUpperCase() + action.slice(1)} uživatele`, text: `Opravdu chceš ${action} účet ${this.user.name}?` },
    });
    const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    try {
      await this.usersService.setUserBlocked(this.user, !this.user.blocked);
      this.alertService.success(this.user.blocked ? 'Uživatel odblokován' : 'Uživatel zablokován');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při změně stavu uživatele');
    }
  }

  protected canStorno(tx: ITransaction): boolean {
    return tx.type === ETransactionType.PAYMENT && !tx.cancellation;
  }

  protected get hasMoreTransactions(): boolean {
    return this.transactions.length < this.transactionsTotal;
  }
}
```

- [ ] **Step 4: Create user-info-detail.component.html**

Create `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.html`:
```html
<div class="uid">

  <!-- Row 1: Profile + Balance -->
  <div class="uid__row uid__row--info">

    <!-- Profile card -->
    <mat-card class="uid__card uid__card--profile">
      <mat-card-content class="uid__profile">
        <div class="uid__avatar">{{ avatarInitial }}</div>
        <div class="uid__profile-info">
          <div class="uid__name">{{ user.name }}</div>
          <div class="uid__meta">{{ user.email }}</div>
          <div class="uid__meta">
            Skupina: {{ user.groups?.[0] ?? '—' }}
          </div>
          <div class="uid__meta" data-testid="member-id">
            ID: <code>{{ user.memberId ? ('MBR-' + user.memberId) : '—' }}</code>
          </div>
          @if (user.blocked) {
            <div class="uid__blocked-badge">⛔ Zablokován</div>
          }
        </div>
        <button mat-icon-button class="uid__edit-btn" (click)="onEditProfile()" matTooltip="Upravit profil">
          <mat-icon>edit</mat-icon>
        </button>
      </mat-card-content>
    </mat-card>

    <!-- Balance card -->
    <mat-card class="uid__card uid__card--balance">
      <mat-card-content class="uid__balance">
        <div class="uid__balance-label">Zůstatek</div>
        @if (!accountLoaded) {
          <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
        } @else if (currencyAccount) {
          <div class="uid__balance-amount" data-testid="balance">{{ currencyAccount.currentAmount }}</div>
          <div class="uid__balance-unit">Kč</div>
          <div class="uid__balance-overdraft">přečerpání: {{ currencyAccount.overdraftLimit }} Kč</div>
        } @else {
          <div class="uid__no-account" data-testid="no-account">
            <mat-icon class="uid__no-account-icon">warning</mat-icon>
            <div>Účet ještě nebyl aktivován</div>
            <small>(první dobití ho vytvoří)</small>
          </div>
        }
      </mat-card-content>
    </mat-card>

  </div>

  <!-- Row 2: Primary actions -->
  <div class="uid__row uid__row--actions">
    <button mat-raised-button color="primary"
            [disabled]="financialDisabled"
            [matTooltip]="financialTooltip"
            (click)="onCharge()">
      <mat-icon>add</mat-icon>
      Dobít kredit
    </button>
    <button mat-raised-button
            [disabled]="financialDisabled || !currencyAccount"
            [matTooltip]="financialDisabled ? financialTooltip : (!currencyAccount ? 'Uživatel nemá účet' : '')"
            (click)="onDischarge()">
      <mat-icon>remove</mat-icon>
      Vybrat kredit
    </button>
    <button mat-raised-button (click)="onAssignCard()">
      <mat-icon>contactless</mat-icon>
      Přiřadit kartu
    </button>
  </div>

  <mat-divider></mat-divider>

  <!-- Row 3: Transaction history -->
  <div class="uid__section">
    <div class="uid__section-label">Historie transakcí</div>
    @if (transactions.length === 0 && accountLoaded) {
      <div class="uid__empty">Žádné transakce</div>
    }
    <div class="uid__tx-list">
      @for (tx of transactions; track tx.id) {
        <div class="uid__tx-row" [class.uid__tx-row--cancelled]="tx.cancellation">
          <span class="uid__tx-desc">{{ tx.info || tx.type }}</span>
          <span class="uid__tx-date">{{ tx.created | date:'dd.MM. HH:mm' }}</span>
          <span class="uid__tx-amount" [class.uid__tx-amount--positive]="tx.amount > 0" [class.uid__tx-amount--negative]="tx.amount < 0">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }} Kč
          </span>
          <span class="uid__tx-action">
            @if (canStorno(tx)) {
              <button mat-button color="warn" (click)="onStorno(tx)">storno</button>
            } @else {
              <span>—</span>
            }
          </span>
        </div>
      }
    </div>
    @if (hasMoreTransactions) {
      <button mat-button (click)="loadMoreTransactions.emit()">Načíst více</button>
    }
  </div>

  <mat-divider></mat-divider>

  <!-- Row 4: Cards -->
  <div class="uid__section uid__section--cards">
    <span class="uid__section-label">Karty</span>
    <div class="uid__cards">
      @for (card of cards; track card.id) {
        <div class="uid__card-chip" [class.uid__card-chip--blocked]="card.blocked">
          <mat-icon>credit_card</mat-icon>
          <span>****{{ String(card.uid).slice(-4) }}</span>
          <span class="uid__card-status" [class.uid__card-status--active]="!card.blocked">
            {{ card.blocked ? '● blokováno' : '● aktivní' }}
          </span>
          <button mat-button (click)="onToggleCardBlocked(card)">
            {{ card.blocked ? 'odblokovat' : 'odebrat' }}
          </button>
        </div>
      }
      @if (cards.length === 0 && accountLoaded) {
        <span class="uid__empty">Žádné karty</span>
      }
    </div>
  </div>

  <mat-divider></mat-divider>

  <!-- Row 5: Account management -->
  <div class="uid__section uid__section--footer">
    <span class="uid__section-label">Správa účtu</span>
    <button mat-stroked-button (click)="onChangePassword()">
      <mat-icon>key</mat-icon>
      Změnit heslo
    </button>
    <button mat-stroked-button
            [color]="user.blocked ? '' : 'warn'"
            (click)="onToggleBlock()">
      <mat-icon>{{ user.blocked ? 'lock_open' : 'block' }}</mat-icon>
      {{ user.blocked ? 'Odblokovat uživatele' : 'Zablokovat uživatele' }}
    </button>
  </div>

</div>
```

**Note:** `String(card.uid).slice(-4)` — add `protected readonly String = String;` to the component class to make `String` accessible in the template.

- [ ] **Step 5: Add `String` to component class**

In `user-info-detail.component.ts`, add inside the class body:
```typescript
protected readonly String = String;
```

- [ ] **Step 6: Create user-info-detail.component.scss**

Create `src/app/modules/admin/modules/user-info/components/user-info-detail/user-info-detail.component.scss`:
```scss
.uid {
  display: flex;
  flex-direction: column;
  gap: 0;

  &__row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    &--info {
      align-items: stretch;
    }

    &--actions {
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
  }

  &__card {
    background-color: var(--mat-sys-surface-container);

    &--profile { flex: 3; }
    &--balance { flex: 1; }
  }

  &__profile {
    display: flex;
    gap: 1rem;
    align-items: center;
    position: relative;
    padding: 1rem !important;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--mat-sys-primary-container);
    color: var(--mat-sys-on-primary-container);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    flex-shrink: 0;
    border: 2px solid var(--mat-sys-primary);
  }

  &__profile-info { flex: 1; }

  &__name { font-size: 1.1rem; font-weight: bold; }

  &__meta { font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); margin-top: 2px; }

  &__blocked-badge { color: var(--mat-sys-error); font-size: 0.85rem; margin-top: 4px; }

  &__edit-btn { position: absolute; top: 8px; right: 8px; }

  &__balance {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem !important;
    min-height: 100px;
  }

  &__balance-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--mat-sys-on-surface-variant); margin-bottom: 0.5rem; }
  &__balance-amount { font-size: 2rem; font-weight: bold; color: var(--mat-sys-tertiary); line-height: 1; }
  &__balance-unit { font-size: 0.9rem; color: var(--mat-sys-on-surface-variant); }
  &__balance-overdraft { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); margin-top: 4px; }

  &__no-account {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--mat-sys-on-surface-variant);
    font-size: 0.85rem;

    &-icon { color: var(--mat-sys-tertiary); font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
  }

  &__section {
    padding: 0.75rem 0;

    &-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--mat-sys-on-surface-variant);
      display: block;
      margin-bottom: 0.5rem;
    }

    &--cards {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    &--footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  }

  &__tx-list { display: flex; flex-direction: column; gap: 2px; max-height: 300px; overflow-y: auto; }

  &__tx-row {
    display: grid;
    grid-template-columns: 1fr 100px 90px 80px;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: 4px;
    background: var(--mat-sys-surface-container);
    align-items: center;
    font-size: 0.9rem;

    &--cancelled { opacity: 0.5; text-decoration: line-through; }
  }

  &__tx-date { color: var(--mat-sys-on-surface-variant); font-size: 0.8rem; }
  &__tx-amount {
    text-align: right; font-weight: bold;
    &--positive { color: #4caf50; }
    &--negative { color: var(--mat-sys-error); }
  }
  &__tx-action { text-align: right; }

  &__empty { color: var(--mat-sys-on-surface-variant); font-size: 0.85rem; }

  &__cards { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  &__card-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--mat-sys-surface-container);
    border-radius: 4px;
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;

    &--blocked { opacity: 0.6; }
  }

  &__card-status {
    font-size: 0.75rem;
    &--active { color: #4caf50; }
  }
}
```

- [ ] **Step 7: Run spec — expect PASS**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx karma start --single-run 2>&1 | grep -E "UserInfoDetailComponent|FAILED|ERROR"
```
Expected: 4 specs, 0 failures.

- [ ] **Step 8: Commit**
```bash
git add src/app/modules/admin/modules/user-info/components/user-info-detail/
git commit -m "feat: add UserInfoDetailComponent with profile, balance, and action layout"
```

---

## Task 4: ChargeDialogComponent

**Files:**
- Create: `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.ts`
- Create: `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.html`

- [ ] **Step 1: Create charge-dialog.component.ts**

Create `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.ts`:
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-info-charge-dialog',
  templateUrl: './charge-dialog.component.html',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
})
export class ChargeDialogComponent {
  private dialogRef = inject(MatDialogRef<ChargeDialogComponent>);

  protected amount: number = 0;
  protected readonly predefinedAmounts = [200, 500, 800, 1000, 1500, 2000];

  protected submit(): void {
    this.dialogRef.close(this.amount);
  }
}
```

- [ ] **Step 2: Create charge-dialog.component.html**

Create `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.html`:
```html
<button mat-icon-button style="position:absolute;top:8px;right:8px" mat-dialog-close>
  <mat-icon>close</mat-icon>
</button>

<h2 mat-dialog-title>Dobít kredit</h2>

<div mat-dialog-content>
  <mat-form-field class="w-100">
    <mat-label>Částka</mat-label>
    <input matInput type="number" [(ngModel)]="amount" min="1">
    <span matSuffix>Kč</span>
  </mat-form-field>

  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">
    @for (val of predefinedAmounts; track val) {
      <button mat-stroked-button (click)="amount = val">{{ val }} Kč</button>
    }
  </div>

  <button mat-raised-button color="primary" style="width:100%" [disabled]="amount <= 0" (click)="submit()" mat-dialog-close>
    Dobít
  </button>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/app/modules/admin/modules/user-info/components/charge-dialog/
git commit -m "feat: add ChargeDialogComponent for user-info dashboard"
```

---

## Task 5: DischargeDialogComponent

**Files:**
- Create: `src/app/modules/admin/modules/user-info/components/discharge-dialog/discharge-dialog.component.ts`
- Create: `src/app/modules/admin/modules/user-info/components/discharge-dialog/discharge-dialog.component.html`

- [ ] **Step 1: Create discharge-dialog.component.ts**

Create `src/app/modules/admin/modules/user-info/components/discharge-dialog/discharge-dialog.component.ts`:
```typescript
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';

@Component({
  selector: 'app-user-info-discharge-dialog',
  templateUrl: './discharge-dialog.component.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class DischargeDialogComponent {
  private dialogRef = inject(MatDialogRef<DischargeDialogComponent>);
  protected data: { user: IUser; account: ICurrencyAccount } = inject(MAT_DIALOG_DATA);

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
```

- [ ] **Step 2: Create discharge-dialog.component.html**

Create `src/app/modules/admin/modules/user-info/components/discharge-dialog/discharge-dialog.component.html`:
```html
<button mat-icon-button style="position:absolute;top:8px;right:8px" mat-dialog-close>
  <mat-icon>close</mat-icon>
</button>

<h2 mat-dialog-title>Vybrat kredit</h2>

<div mat-dialog-content>
  <p>Opravdu chceš vybít kredit a vrátit uživateli jeho peníze?</p>
  <mat-divider style="margin-bottom:1rem"></mat-divider>
  <p style="text-align:center;font-size:1.1rem">{{ data.user.name }}</p>
  <p style="text-align:center;font-size:2rem;font-weight:bold">{{ data.account.currentAmount }} Kč</p>

  <button mat-raised-button color="warn" style="width:100%" (click)="confirm()" mat-dialog-close>
    Vybít
  </button>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/app/modules/admin/modules/user-info/components/discharge-dialog/
git commit -m "feat: add DischargeDialogComponent for user-info dashboard"
```

---

## Task 6: AssignCardDialogComponent

**Files:**
- Create: `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.ts`
- Create: `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.html`

- [ ] **Step 1: Create assign-card-dialog.component.ts**

Create `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.ts`:
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';

@Component({
  selector: 'app-user-info-assign-card-dialog',
  templateUrl: './assign-card-dialog.component.html',
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
})
export class AssignCardDialogComponent {
  private dialogRef = inject(MatDialogRef<AssignCardDialogComponent>);
  private data: { userId: number } = inject(MAT_DIALOG_DATA);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

  protected cardUid: number | null = null;
  protected inProgress = false;

  protected async submit(): Promise<void> {
    if (!this.cardUid) return;
    this.inProgress = true;
    try {
      await this.usersService.addUserCard(this.data.userId, this.cardUid, '', 'Card');
      this.alertService.success('Karta přiřazena');
      this.dialogRef.close(true);
    } catch {
      this.alertService.error('Chyba při přiřazení karty — karta může být již přiřazena jinému uživateli');
    } finally {
      this.inProgress = false;
    }
  }
}
```

- [ ] **Step 2: Create assign-card-dialog.component.html**

Create `src/app/modules/admin/modules/user-info/components/assign-card-dialog/assign-card-dialog.component.html`:
```html
<button mat-icon-button style="position:absolute;top:8px;right:8px" mat-dialog-close>
  <mat-icon>close</mat-icon>
</button>

<h2 mat-dialog-title>Přiřadit kartu</h2>

<div mat-dialog-content>
  <mat-form-field style="width:100%">
    <mat-label>UID karty</mat-label>
    <input matInput type="number" [(ngModel)]="cardUid" (keydown.enter)="submit()"
           placeholder="Přiložit kartu nebo zadat číslo" autofocus>
    <mat-icon matSuffix>contactless</mat-icon>
  </mat-form-field>

  <button mat-raised-button color="primary" style="width:100%"
          [disabled]="!cardUid || inProgress"
          (click)="submit()">
    @if (inProgress) {
      <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
    }
    Přiřadit kartu
  </button>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/app/modules/admin/modules/user-info/components/assign-card-dialog/
git commit -m "feat: add AssignCardDialogComponent for user-info dashboard"
```

---

## Task 7: Wire up MatIcon and fix `String` in template

The template uses `mat-icon` without `MatIconModule` in some places, and `String` reference must work.

- [ ] **Step 1: Add `MatIconModule` to DischargeDialogComponent imports**

In `discharge-dialog.component.ts`, add `MatIconModule` and `MatDividerModule` to `imports`:
```typescript
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
// Add to imports array:
imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
```

- [ ] **Step 2: Add MatIconModule to ChargeDialogComponent imports**

In `charge-dialog.component.ts`, add `MatIconModule`:
```typescript
import { MatIconModule } from '@angular/material/icon';
// Add to imports array:
imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
```

- [ ] **Step 3: Verify `String` accessor in user-info-detail**

Open `user-info-detail.component.ts` and confirm the class has:
```typescript
protected readonly String = String;
```
If not, add it inside the class body.

- [ ] **Step 4: Build check**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx ng build --configuration=development 2>&1 | tail -20
```
Expected: Build successful, 0 errors.

- [ ] **Step 5: Commit if any changes were made**
```bash
git add -p  # review and stage only changed files
git commit -m "fix: add missing module imports to user-info dialogs"
```

---

## Task 8: Check ETransactionType enum and verify storno logic

The `canStorno` method uses `ETransactionType.PAYMENT`. Verify this value exists and the enum path is correct.

- [ ] **Step 1: Check ETransactionType**
```bash
cat /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend/src/app/modules/admin/modules/transactions/services/transaction/types/ETransactionType.ts
```
Expected: enum with at least `PAYMENT` and `DEPOSIT` values.

- [ ] **Step 2: Fix import path in user-info-detail if needed**

If the enum values don't match (e.g., it's `ETransactionType.Payment` instead of `ETransactionType.PAYMENT`), update the `canStorno` method and the import in `user-info-detail.component.ts` accordingly.

- [ ] **Step 3: Final build check**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx ng build --configuration=development 2>&1 | tail -10
```
Expected: Build successful.

- [ ] **Step 4: Run all tests**
```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend && npx karma start --single-run 2>&1 | tail -20
```
Expected: All existing tests pass + new UserInfo specs pass.

- [ ] **Step 5: Final commit**
```bash
git add -A
git commit -m "feat: complete user-info dashboard implementation"
```

---

## Known gaps to verify during implementation

1. **`ETransactionType` values** — check exact casing (PAYMENT vs Payment) in `ETransactionType.ts`
2. **Card blocking** — `UsersService` and `CardsService` have no `blockCard` method; current plan removes the card via `deleteUserCard`. If the backend supports `PUT /cards/:id` with `blocked` flag, extend `CardsService` with a `blockCard(id, blocked)` method and use that instead of delete.
3. **`getUser(id)` in UserInfoComponent.onRefresh()** — `UsersService` has `getUser(id)` confirmed; ensure the cache is invalidated after block/unblock (`setUserBlocked` has `@invalidateCache`).
4. **`w-100` CSS class** — used in charge dialog html; confirm this utility class exists in global styles or replace with `style="width:100%"`.
