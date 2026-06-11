# logistics-web — Repo Guide

> Customer + driver + admin SPA. React + Vite + Tailwind. Deployed to Vercel.

**Phase:** 7 (Web Frontend)
**Status:** ⬜ Not started — scaffold only. Brainstorm a Web spec before implementation.

## What this app does

One single-page app. Three role-gated views:
- **Customer**: register / login, place an order, track in real time, view history, manage profile.
- **Driver**: log in, toggle availability, accept/reject incoming dispatches, see live order details, mark delivery completed.
- **Admin**: order monitoring, driver management, delivery analytics, manual dispatch override.

Routing gates each view by JWT role claim.

## Locked decisions

- **Tech**: React 18, Vite, TypeScript, Tailwind CSS.
- **Deployment**: Vercel. `vercel.json` rewrites `/api/*` → `https://api.<domain>/v1/*` to keep first-party-cookie semantics.
- **State**: lightweight — React Query for server state, Zustand or React context for auth + UI state. Avoid Redux.
- **Realtime**: Socket.IO client connecting directly to `wss://api.<domain>/v1/tracking/socket.io/` (proxied through gateway).
- **Auth**: JWT in `Authorization: Bearer` header. Tokens stored in memory + refresh token in httpOnly cookie (web only).
- **Maps**: TBD per Web spec. Likely MapLibre + free tile provider; possibly Mapbox if budget allows.

## Layout (target)

```
src/
  app/
    routes/                   # role-gated route trees
    customer/
    driver/
    admin/
  features/                   # feature-sliced
    auth/
    orders/
    tracking/
    notifications/
  shared/
    api/                      # gateway client (OpenAPI-typed if feasible)
    ui/                       # design system components
    hooks/
  main.tsx
tests/
public/
vite.config.ts
tailwind.config.ts
vercel.json
```

## Conventions

- Same as platform: Conventional Commits, trunk-based, SemVer tags.
- ESLint + Prettier configs imported from `../logistics-infrastructure/shared/`.
- All API calls go through the typed gateway client. No bespoke `fetch` calls in components.
- Generate TS types from `logistics-contracts/openapi/*.yaml` at build time (or pin to a snapshot in the contracts npm package).

## Locked decisions (from the Web spec — 2026-06-11)

- **Scope:** full three-role app (customer · driver · admin).
- **Design system:** shadcn/ui (Radix + Tailwind), direction A (light slate + indigo); polished via the `ui-ux-pro-max` skill.
- **Routing:** React Router v7, route-level role guards.
- **State:** React Query (server) + Zustand (auth + UI).
- **Forms:** react-hook-form + Zod.
- **Maps:** MapLibre GL JS + OpenFreeMap (dark canvas on tracking/dispatch).
- **Realtime:** Socket.IO client; the driver app is the real location producer.
- **Auth/session:** scoped BFF — 3 Vercel functions hold the refresh token in an httpOnly cookie; access token in memory; reload survives via silent refresh.
- **API types:** `openapi-typescript` generating a **checked-in snapshot** (`src/shared/api/types/`). `gen:api` reads the OpenAPI from the **local sibling checkout** (`../logistics-contracts/openapi/*.yaml`), not the npm package — the published `@angelocp-01/logistics-contracts@0.7.0` ships only `dist/` + `schemas/` (no `openapi/`) and is `access:restricted`, so it can't feed generation and isn't a dependency here. CI/build use the committed snapshot and need no registry access. **Future contracts-repo cleanup:** add `openapi/` to the package `files[]` (and reconsider public access) so consumers can `gen:api` from `node_modules` without a sibling checkout.
- **Tests:** Vitest + RTL + MSW; one Playwright full-loop E2E. No Storybook for V1.
- **Config deviation:** ESLint/Prettier are web-flavored (React-aware) rather than the Node-service vendored copies; the tsconfig is a Vite/React config, not the Node base.

## Don't do

- Don't call internal services directly. Everything goes through the gateway (`/api/*`).
- Don't bake the gateway URL into the build. Read it from `import.meta.env.VITE_API_BASE_URL`.
- Don't store the refresh token in `localStorage`. httpOnly cookie or in-memory only.
- Don't render the admin nav for non-admin users — gate at the route level, not just on visibility.

## Pointers

- Spec: [`../docs/superpowers/specs/2026-05-18-platform-decomposition-design.md`](../docs/superpowers/specs/2026-05-18-platform-decomposition-design.md) §6 Phase 7
- Plan: TBD (brainstorm + plan in Phase 7)
- Tracker: [`../docs/superpowers/tracker.md`](../docs/superpowers/tracker.md)
