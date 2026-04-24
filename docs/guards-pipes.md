---
name: Guards, Interceptor, Pipes, Directives
description: Functional guards, authInterceptor, standalone pipes, directives — usage and test patterns
load_when: adding a guard, using a pipe in template, auth interceptor, directive usage, testing guards
---

# Guards, Interceptor, Pipes, Directives

## Route Guards (`src/app/common/utils/`)

All guards are **functional** (not class-based).

### `authGuard` — `CanActivateFn`
Checks `AuthService.isLoggedIn()`. Redirects to `/login/sign-in` if not authenticated.

### `placeGuard` — `CanActivateFn`
Checks `PlaceService.selectedPlace$`. Redirects to `/place-select` if null.

### `unsavedChangesGuard` — `CanDeactivateFn<CanComponentDeactivate>`
Calls `component.canDeactivate()`. Component shows `window.confirm` if form is dirty.
Component must implement `CanComponentDeactivate` interface.

### Testing functional guards

```typescript
// Do NOT instantiate as class — use runInInjectionContext
const result = TestBed.runInInjectionContext(
  () => authGuard(mockRoute, mockState)
);
```

---

## authInterceptor (`common/interceptors/auth/auth.interceptor.ts`)

**Functional** `HttpInterceptorFn`:
- Adds `Authorization: Bearer <token>` to every request
- On 401: calls `AuthService.logout()` → navigates to login

Registered in `AppModule`:
```typescript
providers: [
  provideHttpClient(withInterceptorsFromDi()),
  { provide: HTTP_INTERCEPTORS, useValue: authInterceptor, multi: true }
]
```

### Testing the interceptor

```typescript
const nextFn = jasmine.createSpy('next').and.returnValue(of(new HttpResponse()));
TestBed.runInInjectionContext(() => authInterceptor(mockRequest, nextFn as HttpHandlerFn));
```

---

## Pipes

All standalone — import in `imports[]`, never `declarations[]`.

### `IsIncludedPipe` — selector `isIncluded`
```html
{{ item | isIncluded: array }}  <!-- boolean -->
EUserRole.ADMIN | isIncluded: userRoles
```

### `IsFeatureAllowedPipe` — selector `isFeatureAllowed`
```html
@if (EFeatureFlag.PRINTER | isFeatureAllowed) { ... }
```

### `PageNamePipe` — selector `pageName`
Maps router events to display names. Used in breadcrumb in `TopMenuComponent`.

### `CanAccessRoutePipe`
Used in `SideMenuComponent` to filter nav links by role.

---

## Directives

### `ClickConfirmDirective` — `(clickConfirm)`
Intercepts click, opens `ConfirmDialogComponent`, emits `clickConfirm` only on confirm.
```html
<button (clickConfirm)="deleteItem(id)" confirmPreset="remove">
  <mat-icon>delete</mat-icon>
</button>
```

### `AutofocusDirective` — `[appAutofocus]`
Calls `.focus()` on the host element in `ngAfterViewInit`.
```html
<input matInput [appAutofocus] ... />
```

### `BackButtonDirective` — `[backButton]`
Calls `Location.back()` on click.
```html
<button mat-raised-button backButton>Zpět</button>
```
