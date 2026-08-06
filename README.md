# Kredsys

Angular app for a cashless system used at events.
Users hold an account with a balance, top it up, and pay with it at places
(bars, shops) through a point-of-sale screen. The app also covers transaction
history, multi-role access, and an admin panel.

It talks to the Kredsys backend over its REST API (`/api/v1.1/`) and
authenticates with a JWT.

## Requirements

- Node.js 20+
- npm

## Getting started

```bash
npm install
ng serve           # -> http://localhost:4200
```

(`npx ng serve` works without a global Angular CLI.) API calls to `/api/v1.1` are proxied
to `http://localhost:8080`, so a local backend is expected there — change the
target in `src/proxy.conf.json` if yours runs elsewhere.

## Configuration

Defaults live in `src/environments/`. Any of them can be overridden at runtime,
without rebuilding, by putting the key in `src/assets/config.json`:

## Build

```bash
npm run build      # production build -> dist/kredsys/
```

Serve the result with any static server; `server/server.js` (Express, gzip, SPA
fallback) is included for that:

```bash
npm start          # = node server/server.js, port 80, override with PORT
```

## Tests

```bash
npm test           # unit tests (Karma/Jasmine), watch mode
npm run test:ci    # unit tests, single run
npm run e2e        # end-to-end tests (Playwright)
npm run lint       # ESLint
```
