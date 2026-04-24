---
name: Config, Build & Tooling
description: Environment config, proxy setup, tsconfig, ESLint, Karma, build and deployment
load_when: proxy errors, build config, ESLint setup, TypeScript config, deployment, karma/test runner config
---

# Config, Build & Tooling

---

## Environment (`src/environments/`)

```typescript
// environment.ts (development)
{
  production: false,
  apiUrl: '/api/v1.1/',       // trailing slash — proxied to localhost:8080
  debug: true,
  walletApiSecret: '...',
  cruciblePrice: 60
}
```

Production: same shape, `production: true`, `debug: false`, `apiUrl` points to real server.

## Runtime config (`src/assets/config.json`)

Loaded at startup by `ConfigService`. Any key overrides the matching key in `environment`.
Ships as `{}` in the repo. Deploy a populated version per environment without rebuilding.

---

## Dev proxy (`proxy.conf.json`)

```json
{
  "/api/v1.1": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

**Angular 20+ uses Vite** — proxy keys are **prefix matches**, NOT glob patterns.
`/api/v1.1` matches all requests starting with that path. Do NOT add `/*`.

---

## TypeScript (`tsconfig.json`)

Notable settings required for Angular 21 + TS 6:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "ignoreDeprecations": "6.0"
  }
}
```

`ignoreDeprecations: "6.0"` suppresses TS6 deprecation warnings for `baseUrl` and `downlevelIteration` still referenced by some tooling.

---

## ESLint (`.eslintrc.json`)

Legacy `.eslintrc.json` format (ESLint 8).

Key rules:
- `@angular-eslint/recommended` v21 does **not** include `@typescript-eslint` → must add explicitly
- `@typescript-eslint/indent` removed in v6 → use core `indent`

```json
{
  "overrides": [{
    "files": ["*.ts"],
    "extends": [
      "plugin:@angular-eslint/recommended",
      "plugin:@angular-eslint/template/process-inline-templates",
      "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
      "@typescript-eslint/explicit-member-accessibility": ["error", {
        "accessibility": "explicit",
        "overrides": { "constructors": "no-public" }
      }],
      "indent": ["error", "tab", { "SwitchCase": 1 }]
    }
  }]
}
```

Run lint: `ng lint`
Auto-fix indentation: `ng lint --fix`

---

## Karma (`karma.conf.js`)

```javascript
process.env.CHROME_BIN = process.env.CHROME_BIN
  || '/snap/chromium/current/usr/lib/chromium-browser/chrome';

browsers: ['ChromeHeadlessNoSandbox'],
customLaunchers: {
  ChromeHeadlessNoSandbox: {
    base: 'ChromeHeadless',
    flags: ['--no-sandbox', '--disable-gpu']
  }
}
```

Chrome binary is snap Chromium — the symlink at `/snap/bin/chromium` is broken; use the full path above.

---

## Build

```bash
ng serve                     # dev server (Vite), localhost:4200
ng build                     # production build → dist/kredsys/
ng test                      # watch mode
ng test --watch=false        # single run
ng lint                      # ESLint
ng lint --fix                # auto-fix
```

---

## Production server (`server/server.js`)

Express static server. Serves `dist/kredsys/` with gzip. All unknown routes → `index.html` (SPA fallback).

```bash
node server/server.js        # port 80 (env PORT overrides)
```

---

## Angular upgrade notes

Upgraded 17 → 21 in four sequential steps:
```bash
ng update @angular/core@18 @angular/cli@18 @angular/material@18 --allow-dirty --force
ng update @angular/core@19 ...   # adds standalone: false to NgModule components
ng update @angular/core@20 ...   # switches dev server to Vite
ng update @angular/core@21 ...   # converts *ngIf/*ngFor to @if/@for
```

Third-party breaking changes encountered:
- `ng2-charts` v10: `NgChartsModule` removed → `BaseChartDirective` + `provideCharts()`
- `angularx-qrcode` v21: `QRCodeModule` removed → `QRCodeComponent`
- `@angular/material` 18+: `@import '@angular/material/theming'` removed from SCSS
