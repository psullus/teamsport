# apps/api — NestJS Backend

## Commands

Run from monorepo root:

- `npm run start:api` — dev server with watch at http://localhost:3000/
- `npm run build:api` — production build
- `npm run test:api` — run unit tests with Vitest

Or from this directory:

- `npm run start:dev` — dev server with watch
- `npm run build` — production build
- `npm test` — run unit tests
- `npm run test:e2e` — run e2e tests

## Architecture

- **Entry point:** `src/main.ts` — bootstraps NestJS on port 3000 with `/api` prefix
- **App module:** `src/app/app.module.ts` — root module
- **Controller:** `src/app/app.controller.ts` — route handlers
- **Service:** `src/app/app.service.ts` — business logic

All endpoints are prefixed with `/api` via `setGlobalPrefix('api')`.

## Testing

Uses Vitest with `unplugin-swc` for decorator support. Unit tests alongside source files (`*.spec.ts`), e2e tests in `test/`.

## Code Style

- 2-space indentation, single quotes, 100 char print width
- Trailing newlines required
