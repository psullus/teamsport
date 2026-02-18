# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo with an Angular 21 frontend (`apps/web`), a NestJS backend (`apps/api`), and a shared TypeScript types package (`packages/shared`). Uses npm workspaces for dependency management.

## Monorepo Structure

```
teamsport/
├── apps/
│   ├── web/          # Angular 21 frontend (port 4200)
│   └── api/          # NestJS backend (port 3000, prefix /api)
└── packages/
    └── shared/       # Shared TypeScript types (Role, User, Organisation)
```

## Commands

### Both apps
- `npm start` — start both web and api dev servers
- `npm run build` — build both apps
- `npm test` — run all tests

### Frontend (Angular)
- `npm run start:web` — dev server at http://localhost:4200/
- `npm run build:web` — production build
- `npm run test:web` — run Angular unit tests

### Backend (NestJS)
- `npm run start:api` — dev server with watch at http://localhost:3000/
- `npm run build:api` — production build
- `npm run test:api` — run NestJS unit tests

See `apps/web/CLAUDE.md` and `apps/api/CLAUDE.md` for app-specific details.

## Architecture

- **Frontend:** Angular 21 standalone components, signals for state, Vite builds
- **Backend:** NestJS 11, all endpoints under `/api` prefix
- **Shared types:** `@teamsport/shared` package, imported by both apps via TypeScript path mapping
- **Proxy:** Angular dev server proxies `/api` requests to `http://localhost:3000`

## TypeScript

Root `tsconfig.json` has shared strict settings. Each app extends or defines its own config:
- `apps/web/tsconfig.json` — extends root, adds Angular compiler options
- `apps/api/tsconfig.json` — standalone (NestJS needs `module: commonjs`)

## Testing

Both apps use **Vitest**. Test files follow the `*.spec.ts` naming convention alongside source files.

## Code Style

- 2-space indentation
- Single quotes (TypeScript)
- Print width: 100 characters
- Trailing newlines required
