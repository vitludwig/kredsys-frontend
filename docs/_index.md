---
name: Kredsys Frontend — Doc Index
description: Master index — always load this first; tells you which other doc files to load
load_when: always
---

# Kredsys Frontend — Doc Index

Angular 21 SPA — credit/wallet system for events. Multi-role users, place-scoped POS sales, account top-ups, transaction history, admin panel.

## What to load

| Task | Load |
|------|------|
| New service | `services.md` + `patterns.md` + `caching.md` |
| New component / template | `components.md` + `patterns.md` + `types-enums.md` |
| New route / guard | `routing-modules.md` + `guards-pipes.md` |
| Write / fix tests | `testing.md` |
| New type / interface | `types-enums.md` |
| Pipe or directive | `guards-pipes.md` + `patterns.md` |
| Caching decorator | `caching.md` |
| Auth / interceptor | `guards-pipes.md` + `services.md` (AuthService section) |
| Build / deploy / proxy | `config-build.md` |
| ESLint / TS config | `config-build.md` |
| Unsure | load this file + `patterns.md` and check the table above |

## File list

- `_index.md` — this file
- `routing-modules.md` — routes, NgModules, standalone modules, lazy loading
- `services.md` — all services with method signatures and notes
- `components.md` — all components with purpose and key inputs/outputs
- `types-enums.md` — all interfaces, types, and enums
- `guards-pipes.md` — guards, authInterceptor, pipes, directives
- `caching.md` — @cache / @invalidateCache decorator system
- `testing.md` — Karma/Jasmine setup, patterns, gotchas
- `patterns.md` — conventions, code patterns to follow in this codebase
- `config-build.md` — environment, proxy, tsconfig, ESLint, build

## Key facts (always relevant)

- API base: `/api/v1.1/` — proxied to `:8080` in dev
- Auth: JWT in `localStorage`, injected by `authInterceptor`
- State: BehaviorSubjects in services — no NgRx
- Templates: `@if` / `@for` (never `*ngIf` / `*ngFor`)
- Standalone pipes go in `imports[]`, not `declarations[]`
- All NgModule components have `standalone: false` explicitly set
