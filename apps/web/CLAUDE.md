# apps/web — Angular Frontend

## Commands

Run from monorepo root:

- `npm run start:web` — dev server at http://localhost:4200/
- `npm run build:web` — production build
- `npm run test:web` — run unit tests with Vitest

Or from this directory:

- `npm start` / `npm run build` / `npm test`

## Architecture

- **Entry point:** `src/main.ts` bootstraps `App` component with `appConfig`
- **App config:** `src/app/app.config.ts` — providers for router and global error listeners
- **Routing:** `src/app/app.routes.ts` — route definitions
- **Root component:** `src/app/app.ts` — standalone component importing `RouterOutlet`

All components use the standalone pattern (no NgModules). Import dependencies directly in each component's `imports` array.

## Proxy

API requests to `/api` are proxied to `http://localhost:3000` via `proxy.conf.json`.

## Code Style

- 2-space indentation, single quotes, 100 char print width
- Trailing newlines required
