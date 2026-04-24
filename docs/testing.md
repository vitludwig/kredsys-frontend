---
name: Testing
description: Karma/Jasmine setup, test patterns, common gotchas — HTTP, guards, interceptors, caching, JWTs
load_when: writing or fixing a spec file, test errors, understanding test setup
---

# Testing

Framework: **Jasmine** + **Karma**
Browser: `ChromeHeadlessNoSandbox` (snap Chromium at `/snap/chromium/current/usr/lib/chromium-browser/chrome`)

```bash
ng test                      # watch mode
ng test --watch=false        # single run (CI)
```

---

## Standard spec skeleton

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { clearAllCaches } from 'app/common/decorators/cache';

describe('FooComponent', () => {
  let component: FooComponent;
  let fixture: ComponentFixture<FooComponent>;

  beforeEach(async () => {
    clearAllCaches();                        // always reset cache
    await TestBed.configureTestingModule({
      declarations: [FooComponent],
      schemas: [NO_ERRORS_SCHEMA],           // suppress unknown child elements
      imports: [MatSnackBarModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: SomeDep, useValue: { method: jasmine.createSpy() } },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
```

---

## HTTP

Use functional providers — **not** the old `HttpClientTestingModule`:

```typescript
providers: [
  provideHttpClient(withInterceptorsFromDi()),
  provideHttpClientTesting(),
]
```

For testing HTTP calls directly, inject `HttpTestingController`:
```typescript
const http = TestBed.inject(HttpTestingController);
// after action:
const req = http.expectOne('/api/v1.1/...');
req.flush(mockData);
http.verify();
```

---

## Functional guards

Guards are functions, not classes. Use `runInInjectionContext`:

```typescript
import { authGuard } from 'app/common/utils/auth.guard';

it('should redirect when not logged in', () => {
  const result = TestBed.runInInjectionContext(
    () => authGuard(mockRoute, mockState)
  );
  // result is UrlTree or boolean
});
```

---

## Functional interceptor

```typescript
import { authInterceptor } from 'app/common/interceptors/auth/auth.interceptor';
import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

it('adds auth header', () => {
  const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse())) as HttpHandlerFn;
  const req = new HttpRequest('GET', '/api/v1.1/test');
  TestBed.runInInjectionContext(() => authInterceptor(req, next));
  const forwarded: HttpRequest<any> = next.calls.mostRecent().args[0];
  expect(forwarded.headers.get('Authorization')).toContain('Bearer');
});
```

---

## Standalone pipes in tests

Put standalone pipes in `imports[]`, never `declarations[]`:

```typescript
imports: [IsIncludedPipe, IsFeatureAllowedPipe]
```

---

## JWT tokens

`jwt-decode` throws `InvalidTokenError` for non-JWT strings. Use a helper:

```typescript
function createMockJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

// usage
const token = createMockJwt({ sub: '1', roles: ['Admin'], exp: 9999999999 });
```

---

## Caching

Always call `clearAllCaches()` in `beforeEach` when testing any service that uses `@cache`:

```typescript
import { clearAllCaches } from 'app/common/decorators/cache';
beforeEach(() => clearAllCaches());
```

---

## Common gotchas

| Error | Fix |
|-------|-----|
| `Cannot read properties of undefined` on service | Mock all `@Injectable` deps in `providers` |
| `InvalidTokenError` | Use `createMockJwt()` not plain strings |
| Standalone pipe in `declarations` | Move to `imports[]` |
| `NullInjectorError: No provider for PlaceService` | Add `{ provide: PlaceService, useValue: { selectedPlace: { id: 1 } } }` |
| Spec has no expectations | Add at least one `expect()` — Jasmine warns but doesn't fail |
| Cache leaking between tests | Add `clearAllCaches()` to `beforeEach` |
| `NG0304: mat-icon not found` | Add `MatIconModule` to `imports` |
