# vri-web

SignConnect VRI web frontend (React + TypeScript + Vite). Talks to the Django REST API.

## Getting started

```bash
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL
npm run dev
```

## Scripts

`dev` · `build` · `lint` · `format` · `format:check` · `typecheck` · `test`

## Branching

- `main`: release only. `dev`: integration branch. Direct commits/pushes to `main` are blocked by Husky hooks.
- Work on `feature/<story-id>-short-name` (e.g. `feature/V2-066-role-selection`) branched from `dev`, then open a PR into `dev`.
- CI (lint, format, test, build) must pass before merging.

## Structure

```
src/
  pages/        route-level screens, grouped by area (registration, auth, dashboards, admin)
  components/   shared UI (ProtectedRoute, ...)
  features/     feature logic and state (auth, ...)
  routes/       router config
  services/     API client and endpoint wrappers
  hooks/ types/ styles/ test/
```
