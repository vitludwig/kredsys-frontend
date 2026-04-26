# E2E Tests (Playwright)

Foundation for the Kredsys E2E test suite. See
`docs/superpowers/specs/2026-04-26-playwright-e2e-tests-design.md` for the full design.

## Quick start

```bash
npm install
npx playwright install chromium
npm run e2e
```

The test runner starts `ng serve` automatically. Default mode is `mock` — no
backend required.

## Modes

| Mode | Command | Use case |
|---|---|---|
| `mock` (default) | `npm run e2e` | Fast, deterministic, offline, full HTTP intercept |
| `real` | `npm run e2e:real` | Against a running backend with `seed.sql` loaded |

In real mode, the backend + frontend must already be running. Override the
target URL with `E2E_BASE_URL=https://...`.

## Useful commands

```bash
npm run e2e               # mock mode, headless
npm run e2e:headed        # mock mode, visible browser
npm run e2e:ui            # Playwright UI mode
npm run e2e:report        # open last HTML report
npm run e2e:gen-sql       # regenerate e2e/seed/seed.sql from fixtures
```

## Layout

- `fixtures/data/` — TypeScript fixtures (single source of truth)
- `fixtures/api-mock.ts` + `api-mock-handlers.ts` — `page.route()` registry
- `fixtures/auth-adapter.ts` — Mock vs Real login adapter
- `fixtures/sql-generator.ts` — emits `seed/seed.sql`
- `support/personas.ts` — `asAdmin` / `asWorker` / `asPowerSalesman` / `asMember`
- `support/pos.ts` — `scanCard`, `scanNewCard`, `addToBasket`, `submitOrder`
- `support/selectors.ts` — `SEL.*` constants matching `data-testid` attributes
- `support/messages.ts` — Czech UI text constants
- `tests/` — Playwright specs

## Adding a test

```typescript
import { test, expect } from '../support/personas';
import { SEL } from '../support/selectors';

test('admin sees users list', async ({ asAdmin }) => {
  await asAdmin.goto('/admin/users');
  await expect(asAdmin.getByTestId(SEL.row.user(4))).toBeVisible();
});
```

## Adding a fixture

1. Edit the relevant file in `fixtures/data/`.
2. Re-run `npm run e2e:gen-sql` to regenerate `seed/seed.sql`.
3. Commit both the fixture change and the regenerated SQL.

## Known limitations

- HTTP error simulations (5xx, network failure) only work in mock mode.
  These tests are skipped automatically in real mode.
- Web Bluetooth (printer) is out of scope. The mock layer stubs
  `navigator.bluetooth` so headless Chromium doesn't crash on `PrintService`
  initialization.
- Chromium only — Web NFC/BT are Chromium-only anyway.
