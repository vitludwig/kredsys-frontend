---
name: Patterns & Conventions
description: Code conventions this codebase follows — templates, services, components, navigation, dialogs, forms
load_when: adding any new code, unsure about conventions, reviewing patterns before implementing a feature
---

# Patterns & Conventions

---

## Templates — control flow

Always use Angular built-in control flow. Never use `*ngIf` / `*ngFor`.

```html
@if (condition) {
  ...
} @else {
  ...
}

@for (item of items; track item.id) {
  ...
}
```

---

## Service HTTP calls

```typescript
// always return Promise, not Observable
async getUsers(): Promise<IUser[]> {
  return firstValueFrom(this.http.get<IUser[]>(`${environment.apiUrl}users`));
}
```

No base class. No catchError in services — let errors propagate; components handle via `AlertService`.

---

## Component subscriptions

Extend `WithSubscriptionsComponent` in every component that subscribes to observables:

```typescript
export class FooComponent extends WithSubscriptionsComponent {
  ngOnInit() {
    this.someService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(...);
  }
}
```

`destroy$` emits on `ngOnDestroy` (handled by base class).

---

## Navigation

```typescript
// always use ERoute enum
this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS]);
this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS, userId, ERoute.EDIT]);
```

---

## Dialogs

```typescript
// open
const ref = this.dialog.open(MyDialogComponent, {
  data: { userId: 123 }
});
ref.afterClosed().subscribe(result => { ... });

// inside dialog component
constructor(
  private dialogRef: MatDialogRef<MyDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { userId: number }
) {}

this.dialogRef.close(result);
```

---

## Form validation display

```typescript
// in component
public showValidationErrors = false;

onSubmit() {
  this.showValidationErrors = true;
  if (!this.form.valid) return;
  // proceed
}
```

```html
@if (showValidationErrors && form.get('name')?.invalid) {
  <app-error-message>Povinné pole</app-error-message>
}
```

---

## Caching in services

```typescript
@cache(ETime.MINUTE * 5, [ECacheTag.USERS])
async getUsers(): Promise<IUser[]> { ... }

@invalidateCache([ECacheTag.USER, ECacheTag.USERS])
async updateUser(user: IUser): Promise<void> { ... }
```

See `caching.md` for full details.

---

## Standalone vs NgModule

- **New features** → standalone components, `loadComponent()` routes
- **Existing features** → NgModule pattern, all components have `standalone: false` explicitly
- Never mix patterns within a single feature module

---

## NgModule components

All NgModule components require `standalone: false` (Angular 19 migration):

```typescript
@Component({
  selector: 'app-foo',
  standalone: false,
  templateUrl: './foo.component.html',
})
export class FooComponent { }
```

---

## Standalone pipes in templates

```typescript
// in NgModule: put pipe in imports[], not declarations[]
@NgModule({
  imports: [IsIncludedPipe, IsFeatureAllowedPipe],
})
```

```html
{{ item | isIncluded: list }}
@if (EFeatureFlag.PRINTER | isFeatureAllowed) { ... }
```

---

## Feature flags

```html
@if (EFeatureFlag.PRINTER | isFeatureAllowed) {
  <button (click)="printService.connect()">Připojit tiskárnu</button>
}
```

---

## Overdraft check in templates

```html
<!-- overdraftLimit is POSITIVE; negative balance limit = -overdraftLimit -->
[class.text-danger]="totalLeft < -((account$ | async)?.overdraftLimit ?? 0)"
[disabled]="totalLeft < -((account$ | async)?.overdraftLimit ?? 0)"
```

---

## Goods ordering (PlaceDetailComponent)

Uses `CdkDragDrop`. Position not saved until user clicks "Potvrdit změnu pozice".
`goodsPositionChanged` flag → `unsavedChangesGuard` warns on navigation.

---

## AlertService usage

```typescript
// inject and use — never open MatSnackBar directly
constructor(private alert: AlertService) {}

try {
  await this.service.save(data);
  this.alert.success('Uloženo');
} catch {
  this.alert.error('Chyba při ukládání');
}
```
