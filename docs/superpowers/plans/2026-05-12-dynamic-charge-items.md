# Dynamic Charge Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "Kelímek" button in charge dialogs with a dynamic list of named items managed through a new admin settings section backed by the existing backend Settings API.

**Architecture:** A new `SettingsService` reads/writes `charge_items` (a JSON-serialised `IChargeItem[]`) from `/api/v1.1/settings/charge_items`. A standalone `ChargeItemsComponent` under `/admin/settings` provides CRUD for those items. Both `ChargeDialogComponent` and `ChargeFormComponent` load items from `SettingsService` on init and render them as dynamic buttons.

**Tech Stack:** Angular 21, Angular Material, Karma/Jasmine, HttpTestingController

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/common/types/IChargeItem.ts` | `IChargeItem` interface |
| Modify | `src/app/common/types/ERoute.ts` | Add `ADMIN_SETTINGS` |
| Create | `src/app/modules/admin/services/settings/settings.service.ts` | HTTP wrapper for charge_items setting |
| Create | `src/app/modules/admin/services/settings/settings.service.spec.ts` | Unit tests |
| Create | `src/app/modules/admin/modules/settings/charge-items.component.ts` | Standalone CRUD component |
| Create | `src/app/modules/admin/modules/settings/charge-items.component.html` | Template |
| Create | `src/app/modules/admin/modules/settings/charge-items.component.scss` | Styles |
| Create | `src/app/modules/admin/modules/settings/charge-items.component.spec.ts` | Unit tests |
| Modify | `src/app/modules/admin/admin-routing.module.ts` | Add `/admin/settings` route |
| Modify | `src/app/common/modules/menu/components/side-menu/side-menu.component.html` | Add nav item |
| Modify | `src/app/modules/sale/components/charge-dialog/charge-dialog.component.ts` | Inject SettingsService, load items |
| Modify | `src/app/modules/sale/components/charge-dialog/charge-dialog.component.html` | Dynamic `@for` buttons |
| Modify | `src/app/modules/sale/components/charge-dialog/charge-dialog.component.spec.ts` | Update tests |
| Modify | `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.ts` | Inject SettingsService, load items |
| Modify | `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.html` | Dynamic `@for` buttons |
| Modify | `src/app/common/services/config/types/IAppConfig.ts` | Remove `cruciblePrice` |
| Modify | `src/environments/environment.ts` | Remove `cruciblePrice` |
| Modify | `src/environments/environment.prod.ts` | Remove `cruciblePrice` |
| Modify | `src/app/common/services/config/config.service.spec.ts` | Remove `cruciblePrice` from test assertions |

---

## Task 1: IChargeItem type + ERoute constant

**Files:**
- Create: `src/app/common/types/IChargeItem.ts`
- Modify: `src/app/common/types/ERoute.ts`

- [ ] **Step 1: Create IChargeItem type**

Create `src/app/common/types/IChargeItem.ts`:
```typescript
export interface IChargeItem {
  label: string;
  amount: number;
}
```

- [ ] **Step 2: Add ADMIN_SETTINGS to ERoute**

In `src/app/common/types/ERoute.ts`, add after `ADMIN_USER_INFO`:
```typescript
ADMIN_SETTINGS = 'settings',
```

- [ ] **Step 3: Commit**

```bash
git add src/app/common/types/IChargeItem.ts src/app/common/types/ERoute.ts
git commit -m "feat: add IChargeItem type and ADMIN_SETTINGS route constant"
```

---

## Task 2: SettingsService

**Files:**
- Create: `src/app/modules/admin/services/settings/settings.service.ts`
- Create: `src/app/modules/admin/services/settings/settings.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/modules/admin/services/settings/settings.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { environment } from '../../../../../environments/environment';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getChargeItems', () => {
    it('returns parsed items when setting exists', async () => {
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(req.request.method).toBe('GET');
      req.flush({ value: '[{"label":"Kelímek","amount":60}]' });
      const result = await promise;
      expect(result).toEqual([{ label: 'Kelímek', amount: 60 }]);
    });

    it('returns empty array on 404', async () => {
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      const result = await promise;
      expect(result).toEqual([]);
    });

    it('returns empty array when value is null', async () => {
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      req.flush({ value: null });
      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  describe('saveChargeItems', () => {
    it('PUTs when setting already exists', async () => {
      // First getChargeItems to prime existence
      const getPromise = service.getChargeItems();
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush({ value: '[]' });
      await getPromise;

      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const putReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({ value: '[{"label":"Test","amount":50}]' });
      putReq.flush({ value: '[{"label":"Test","amount":50}]' });
      await savePromise;
    });

    it('POSTs to create when setting does not exist', async () => {
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      // GET to check existence — returns 404
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush('Not found', { status: 404, statusText: 'Not Found' });
      // POST to create
      const postReq = httpMock.expectOne(`${baseUrl}settings`);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual({
        key: 'charge_items',
        value: '[{"label":"Test","amount":50}]',
        description: 'Dynamické položky při nabíjení kreditu',
        isPublic: true,
      });
      postReq.flush({ value: '[{"label":"Test","amount":50}]' });
      await savePromise;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend
npx karma start --single-run --include="**/settings.service.spec.ts" 2>&1 | tail -20
```
Expected: FAILED — `SettingsService` not found.

- [ ] **Step 3: Implement SettingsService**

Create `src/app/modules/admin/services/settings/settings.service.ts`:
```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { ConfigService } from '../../../../common/services/config/config.service';

interface ISettingReadDto {
  value: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  private get baseUrl(): string {
    return this.configService.config.apiUrl + 'settings/';
  }

  private settingExists: boolean | null = null;

  async getChargeItems(): Promise<IChargeItem[]> {
    try {
      const dto = await firstValueFrom(
        this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`)
      );
      this.settingExists = true;
      if (!dto.value) return [];
      return JSON.parse(dto.value) as IChargeItem[];
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 404) {
        this.settingExists = false;
      }
      return [];
    }
  }

  async saveChargeItems(items: IChargeItem[]): Promise<void> {
    const value = JSON.stringify(items);
    const exists = this.settingExists ?? await this.checkExists();

    if (exists) {
      await firstValueFrom(
        this.http.put(`${this.baseUrl}charge_items`, { value })
      );
    } else {
      await firstValueFrom(
        this.http.post(this.configService.config.apiUrl + 'settings', {
          key: 'charge_items',
          value,
          description: 'Dynamické položky při nabíjení kreditu',
          isPublic: true,
        })
      );
      this.settingExists = true;
    }
  }

  private async checkExists(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.get<ISettingReadDto>(`${this.baseUrl}charge_items`)
      );
      this.settingExists = true;
      return true;
    } catch {
      this.settingExists = false;
      return false;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/vitek/Projects/RZB-IT/kredsys/kredsys-frontend
yarn run test --include="**/settings.service.spec.ts" 2>&1 | tail -20
```
Expected: all 5 specs PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/services/settings/
git commit -m "feat: add SettingsService for charge_items backend setting"
```

---

## Task 3: ChargeItemsComponent (standalone)

**Files:**
- Create: `src/app/modules/admin/modules/settings/charge-items.component.ts`
- Create: `src/app/modules/admin/modules/settings/charge-items.component.html`
- Create: `src/app/modules/admin/modules/settings/charge-items.component.scss`
- Create: `src/app/modules/admin/modules/settings/charge-items.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/modules/admin/modules/settings/charge-items.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChargeItemsComponent } from './charge-items.component';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

describe('ChargeItemsComponent', () => {
  let component: ChargeItemsComponent;
  let fixture: ComponentFixture<ChargeItemsComponent>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [
      'getChargeItems',
      'saveChargeItems',
    ]);
    mockSettingsService.getChargeItems.and.returnValue(Promise.resolve([
      { label: 'Kelímek', amount: 60 },
    ]));
    mockSettingsService.saveChargeItems.and.returnValue(Promise.resolve());

    mockAlertService = jasmine.createSpyObj('AlertService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [ChargeItemsComponent, NoopAnimationsModule],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChargeItemsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create and load items on init', () => {
    expect(component).toBeTruthy();
    expect(mockSettingsService.getChargeItems).toHaveBeenCalled();
  });

  it('addItem appends an empty item', () => {
    const initialCount = component['items'].length;
    component.addItem();
    expect(component['items'].length).toBe(initialCount + 1);
    expect(component['items'].at(-1)).toEqual({ label: '', amount: 0 });
  });

  it('removeItem removes item at given index', () => {
    component['items'] = [{ label: 'A', amount: 10 }, { label: 'B', amount: 20 }];
    component.removeItem(0);
    expect(component['items']).toEqual([{ label: 'B', amount: 20 }]);
  });

  it('save calls saveChargeItems and shows success', async () => {
    await component.save();
    expect(mockSettingsService.saveChargeItems).toHaveBeenCalledWith(component['items']);
    expect(mockAlertService.success).toHaveBeenCalled();
  });

  it('save shows error alert on failure', async () => {
    mockSettingsService.saveChargeItems.and.returnValue(Promise.reject(new Error('fail')));
    await component.save();
    expect(mockAlertService.error).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
yarn run test --include="**/charge-items.component.spec.ts" 2>&1 | tail -20
```
Expected: FAILED — `ChargeItemsComponent` not found.

- [ ] **Step 3: Implement ChargeItemsComponent**

Create `src/app/modules/admin/modules/settings/charge-items.component.ts`:
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

@Component({
  selector: 'app-charge-items',
  templateUrl: './charge-items.component.html',
  styleUrls: ['./charge-items.component.scss'],
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
})
export class ChargeItemsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private alertService = inject(AlertService);

  protected items: IChargeItem[] = [];

  async ngOnInit(): Promise<void> {
    this.items = await this.settingsService.getChargeItems();
  }

  addItem(): void {
    this.items = [...this.items, { label: '', amount: 0 }];
  }

  removeItem(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
  }

  async save(): Promise<void> {
    try {
      await this.settingsService.saveChargeItems(this.items);
      this.alertService.success('Nastavení uloženo');
    } catch {
      this.alertService.error('Chyba při ukládání nastavení');
    }
  }
}
```

Create `src/app/modules/admin/modules/settings/charge-items.component.html`:
```html
<h2>Rychlé položky při nabíjení</h2>

<div class="items-list">
  @for (item of items; track $index) {
    <div class="item-row">
      <mat-form-field>
        <mat-label>Název</mat-label>
        <input matInput [(ngModel)]="item.label" placeholder="např. Kelímek">
      </mat-form-field>
      <mat-form-field>
        <mat-label>Částka</mat-label>
        <input matInput type="number" [(ngModel)]="item.amount">
        <div matSuffix>Kč</div>
      </mat-form-field>
      <button mat-icon-button color="warn" (click)="removeItem($index)" aria-label="Smazat">
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  }
</div>

<div class="actions">
  <button mat-stroked-button (click)="addItem()">
    <mat-icon>add</mat-icon> Přidat položku
  </button>
  <button mat-raised-button color="primary" (click)="save()">Uložit</button>
</div>
```

Create `src/app/modules/admin/modules/settings/charge-items.component.scss`:
```scss
:host {
  display: block;
  padding: 24px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;

  mat-form-field {
    flex: 1;
  }
}

.actions {
  display: flex;
  gap: 12px;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn run test --include="**/charge-items.component.spec.ts" 2>&1 | tail -20
```
Expected: all 5 specs PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/admin/modules/settings/
git commit -m "feat: add standalone ChargeItemsComponent for managing charge quick-items"
```

---

## Task 4: Route + navigation

**Files:**
- Modify: `src/app/modules/admin/admin-routing.module.ts`
- Modify: `src/app/common/modules/menu/components/side-menu/side-menu.component.html`

- [ ] **Step 1: Add route to admin-routing.module.ts**

In `src/app/modules/admin/admin-routing.module.ts`, add to the `routes` array before the closing `]`:
```typescript
{
  path: ERoute.ADMIN_SETTINGS,
  loadComponent: () =>
    import('./modules/settings/charge-items.component').then(
      (m) => m.ChargeItemsComponent
    ),
  data: {
    name: 'Nastavení',
  },
},
```

- [ ] **Step 2: Add nav item to side-menu**

In `src/app/common/modules/menu/components/side-menu/side-menu.component.html`, inside the admin sub-menu `<div class="sub-menu">`, add after the "Nabíjedlo" `@if` block:

```html
@if (userRoles | canAccessRoute: ERoute.ADMIN_SETTINGS) {
  <a
    [class.active]="router.url === '/' + ERoute.ADMIN + '/' + ERoute.ADMIN_SETTINGS"
    [routerLink]="[ERoute.ADMIN, ERoute.ADMIN_SETTINGS]"
    mat-list-item
    data-testid="nav-admin-settings"
    >
    Nastavení
  </a>
}
```

- [ ] **Step 3: Verify app builds without errors**

```bash
yarn run build 2>&1 | tail -20
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/admin/admin-routing.module.ts \
        src/app/common/modules/menu/components/side-menu/side-menu.component.html
git commit -m "feat: add /admin/settings route and nav item for charge items management"
```

---

## Task 5: Update ChargeDialogComponent

**Files:**
- Modify: `src/app/modules/sale/components/charge-dialog/charge-dialog.component.ts`
- Modify: `src/app/modules/sale/components/charge-dialog/charge-dialog.component.html`
- Modify: `src/app/modules/sale/components/charge-dialog/charge-dialog.component.spec.ts`

- [ ] **Step 1: Write failing test**

Replace the contents of `src/app/modules/sale/components/charge-dialog/charge-dialog.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChargeDialogComponent } from './charge-dialog.component';
import { SettingsService } from '../../../../modules/admin/services/settings/settings.service';
import { clearAllCaches } from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ChargeDialogComponent', () => {
  let component: ChargeDialogComponent;
  let fixture: ComponentFixture<ChargeDialogComponent>;
  let mockSettingsService: jasmine.SpyObj<SettingsService>;

  beforeEach(async () => {
    clearAllCaches();
    mockSettingsService = jasmine.createSpyObj('SettingsService', ['getChargeItems']);
    mockSettingsService.getChargeItems.and.returnValue(
      Promise.resolve([{ label: 'Kelímek', amount: 60 }])
    );

    await TestBed.configureTestingModule({
      declarations: [ChargeDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: 0 },
        { provide: SettingsService, useValue: mockSettingsService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ChargeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads charge items on init', () => {
    expect(mockSettingsService.getChargeItems).toHaveBeenCalled();
    expect(component['chargeItems']).toEqual([{ label: 'Kelímek', amount: 60 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn run test --include="**/charge-dialog.component.spec.ts" 2>&1 | tail -20
```
Expected: FAILED — `chargeItems` property not found / `SettingsService` not provided.

- [ ] **Step 3: Update ChargeDialogComponent TS**

Replace `src/app/modules/sale/components/charge-dialog/charge-dialog.component.ts`:
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { SettingsService } from '../../../admin/services/settings/settings.service';

@Component({
  selector: 'app-charge-dialog',
  templateUrl: './charge-dialog.component.html',
  styleUrls: ['./charge-dialog.component.scss'],
  standalone: false
})
export class ChargeDialogComponent implements OnInit {
  protected dialogRef = inject(MatDialogRef<ChargeDialogComponent>);
  protected amount: number = inject(MAT_DIALOG_DATA);
  private settingsService = inject(SettingsService);

  protected predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
  protected chargeItems: IChargeItem[] = [];

  async ngOnInit(): Promise<void> {
    this.chargeItems = await this.settingsService.getChargeItems();
  }

  public submit(): void {
    this.dialogRef.close(this.amount);
  }
}
```

- [ ] **Step 4: Update ChargeDialogComponent HTML**

Replace the hardcoded Kelímek button in `src/app/modules/sale/components/charge-dialog/charge-dialog.component.html`. Change from:
```html
    <button mat-stroked-button
      (click)="amount = cruciblePrice"
      >Kelímek
    </button>
```
To:
```html
    @for (item of chargeItems; track item.label) {
      <button mat-stroked-button
        (click)="amount = item.amount"
        >{{ item.label }}
      </button>
    }
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
yarn run test --include="**/charge-dialog.component.spec.ts" 2>&1 | tail -20
```
Expected: all 2 specs PASSED.

- [ ] **Step 6: Commit**

```bash
git add src/app/modules/sale/components/charge-dialog/
git commit -m "feat: replace hardcoded Kelímek button with dynamic charge items in ChargeDialogComponent"
```

---

## Task 6: Update ChargeFormComponent

**Files:**
- Modify: `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.ts`
- Modify: `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.html`

- [ ] **Step 1: Update ChargeFormComponent TS**

In `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.ts`:

Remove the `ConfigService` import and `cruciblePrice` field. Add `SettingsService` and `chargeItems`. The updated file:
```typescript
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrency, ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { UsersService } from '../../../../services/users/users.service';
import { CurrencyService } from '../../../../services/currency/currency.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { IChargeResult } from '../../types/IChargeResult';
import { IChargeItem } from '../../../../../../common/types/IChargeItem';
import { SettingsService } from '../../../../services/settings/settings.service';

@Component({
  selector: 'app-charge-form',
  templateUrl: './charge-form.component.html',
  styleUrls: ['./charge-form.component.scss'],
  standalone: false
})
export class ChargeFormComponent implements OnInit {
  private usersService = inject(UsersService);
  private currencyService = inject(CurrencyService);
  private alertService = inject(AlertService);
  private settingsService = inject(SettingsService);

  protected amount: number | null;
  protected predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
  protected chargeItems: IChargeItem[] = [];
  protected user: IUser | null;
  protected currencyAccount: ICurrencyAccount | null;

  @Input()
  public set cardId(value: number | null) {
    this.#cardId = value;
    this.setCardId(value);
  }

  public get cardId(): number | null {
    return this.#cardId;
  }

  @Output()
  public charge: EventEmitter<IChargeResult> = new EventEmitter<IChargeResult>();

  #cardId: number | null;
  protected defaultCurrency: ICurrency;

  public async ngOnInit(): Promise<void> {
    [this.defaultCurrency, this.chargeItems] = await Promise.all([
      this.currencyService.getDefaultCurrency(),
      this.settingsService.getChargeItems(),
    ]);
  }

  public async setCardId(id: number | null): Promise<void> {
    if (id === null) return;
    this.#cardId = id;
    try {
      this.user = await this.usersService.getUserByCardUid(id);
      this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
    } catch (e) {
      console.error(e);
      this.cardId = null;
      this.alertService.error('Uživatel s touto kartou je blokovaný nebo karta neexistuje');
    }
  }

  public async submit(): Promise<void> {
    if (!this.user) return;

    this.charge.emit({
      amount: this.amount ?? 0,
      user: this.user,
      currencyId: this.currencyAccount?.currencyId ?? this.defaultCurrency.id!,
    });

    this.user = null;
    this.currencyAccount = null;
    this.amount = null;
    this.#cardId = null;
  }
}
```

- [ ] **Step 2: Update ChargeFormComponent HTML**

In `src/app/modules/admin/modules/charge/components/charge-form/charge-form.component.html`, replace:
```html
    <button mat-stroked-button
      class="me-2"
      (click)="amount = cruciblePrice"
      >Kelímek
    </button>
```
With:
```html
    @for (item of chargeItems; track item.label) {
      <button mat-stroked-button
        class="me-2"
        (click)="amount = item.amount"
        >{{ item.label }}
      </button>
    }
```

- [ ] **Step 3: Run all tests to verify no regressions**

```bash
yarn run test 2>&1 | tail -30
```
Expected: all specs PASSED (charge-form spec `should create` remains green).

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/admin/modules/charge/components/charge-form/
git commit -m "feat: replace hardcoded Kelímek button with dynamic charge items in ChargeFormComponent"
```

---

## Task 7: Update user-info ChargeDialogComponent

The standalone charge dialog in the user-info module (`src/app/modules/admin/modules/user-info/components/charge-dialog/`) doesn't use `cruciblePrice` but also doesn't show dynamic items. Update it for consistency.

**Files:**
- Modify: `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.ts`
- Modify: `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.html`

- [ ] **Step 1: Update component TS**

Replace `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.ts`:
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IChargeItem } from '../../../../../../common/types/IChargeItem';
import { SettingsService } from '../../../../services/settings/settings.service';

@Component({
  selector: 'app-user-info-charge-dialog',
  templateUrl: './charge-dialog.component.html',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
})
export class ChargeDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ChargeDialogComponent>);
  private settingsService = inject(SettingsService);

  protected amount: number = 0;
  protected readonly predefinedAmounts = [200, 500, 800, 1000, 1500, 2000];
  protected chargeItems: IChargeItem[] = [];

  async ngOnInit(): Promise<void> {
    this.chargeItems = await this.settingsService.getChargeItems();
  }

  protected submit(): void {
    this.dialogRef.close(this.amount);
  }
}
```

- [ ] **Step 2: Update template**

In `src/app/modules/admin/modules/user-info/components/charge-dialog/charge-dialog.component.html`, add dynamic items after the predefined amounts `@for` block, before the submit button:

```html
<button mat-icon-button style="position:absolute;top:8px;right:8px" mat-dialog-close>
  <mat-icon>close</mat-icon>
</button>

<h2 mat-dialog-title>Dobít kredit</h2>

<div mat-dialog-content>
  <mat-form-field style="width:100%">
    <mat-label>Částka</mat-label>
    <input matInput type="number" [(ngModel)]="amount" min="1" data-testid="charge-amount">
    <span matSuffix>Kč</span>
  </mat-form-field>

  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">
    @for (val of predefinedAmounts; track val) {
      <button mat-stroked-button (click)="amount = val">{{ val }} Kč</button>
    }
    @for (item of chargeItems; track item.label) {
      <button mat-stroked-button (click)="amount = item.amount">{{ item.label }}</button>
    }
  </div>

  <button mat-raised-button color="primary" style="width:100%" [disabled]="amount <= 0" (click)="submit()" data-testid="charge-submit">
    Dobít
  </button>
</div>
```

- [ ] **Step 3: Run all tests**

```bash
yarn run test 2>&1 | tail -20
```
Expected: all specs PASSED.

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/admin/modules/user-info/components/charge-dialog/
git commit -m "feat: add dynamic charge items to user-info ChargeDialogComponent"
```

---

## Task 8: Remove cruciblePrice cleanup

**Files:**
- Modify: `src/app/common/services/config/types/IAppConfig.ts`
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`
- Modify: `src/app/common/services/config/config.service.spec.ts`

- [ ] **Step 1: Remove cruciblePrice from IAppConfig**

In `src/app/common/services/config/types/IAppConfig.ts`, remove the `cruciblePrice: number;` line. Result:
```typescript
export interface IAppConfig {
  apiUrl: string;
}
```

- [ ] **Step 2: Remove cruciblePrice from environment.ts**

In `src/environments/environment.ts`, remove the `cruciblePrice: 60` line.

- [ ] **Step 3: Remove cruciblePrice from environment.prod.ts**

In `src/environments/environment.prod.ts`, remove the `cruciblePrice: 60` line.

- [ ] **Step 4: Update config.service.spec.ts**

In `src/app/common/services/config/config.service.spec.ts`:
- In the `'should load and merge config from /assets/config.json'` test: change `mockConfig` to `{ apiUrl: '/custom-api/' }` (remove `cruciblePrice: 100`) and remove the assertion `expect(service.config.cruciblePrice).toBe(100)`
- In the `'should merge remote config over environment defaults'` test: change `partialConfig` to `{ apiUrl: '/custom-api/' }` and remove the `cruciblePrice` assertions; keep only the `apiUrl` assertion
- Remove any remaining `cruciblePrice` references

Updated spec:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';
import { environment } from '../../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [],
      providers: [ConfigService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load and merge config from /assets/config.json', async () => {
    const mockConfig = { apiUrl: '/custom-api/' };
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await loadPromise;

    expect(service.config.apiUrl).toBe('/custom-api/');
  });

  it('should fall back to environment on HTTP error', async () => {
    spyOn(console, 'error');
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    req.error(new ProgressEvent('Network error'));

    await loadPromise;

    expect(service.config).toEqual(environment as any);
    expect(console.error).toHaveBeenCalledWith('Unable to load app config file');
  });

  it('config getter should return environment when no config has been loaded', () => {
    expect(service.config).toEqual(environment as any);
  });

  it('should merge remote config over environment defaults', async () => {
    const partialConfig = { apiUrl: '/custom-api/' };
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    req.flush(partialConfig);

    await loadPromise;

    expect(service.config.apiUrl).toBe('/custom-api/');
  });
});
```

- [ ] **Step 5: Run full test suite**

```bash
yarn run test 2>&1 | tail -30
```
Expected: all specs PASSED, no `cruciblePrice` references remaining.

- [ ] **Step 6: Commit**

```bash
git add src/app/common/services/config/types/IAppConfig.ts \
        src/environments/environment.ts \
        src/environments/environment.prod.ts \
        src/app/common/services/config/config.service.spec.ts
git commit -m "chore: remove cruciblePrice from IAppConfig and environments"
```
