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

## Open items (decide in the Web spec)

- Design system: build minimal in-house (Tailwind primitives) vs. adopt shadcn/ui vs. headless lib
- Map library: MapLibre + OSM tiles (free) vs. Mapbox (paid free tier)
- Route library: React Router v6 vs. TanStack Router
- Form library: react-hook-form + Zod (likely)
- Storybook: yes/no for V1
- E2E testing: Playwright? cypress? skip for V1?

## Don't do

- Don't call internal services directly. Everything goes through the gateway (`/api/*`).
- Don't bake the gateway URL into the build. Read it from `import.meta.env.VITE_API_BASE_URL`.
- Don't store the refresh token in `localStorage`. httpOnly cookie or in-memory only.
- Don't render the admin nav for non-admin users — gate at the route level, not just on visibility.

## Pointers

- Spec: [`../docs/superpowers/specs/2026-05-18-platform-decomposition-design.md`](../docs/superpowers/specs/2026-05-18-platform-decomposition-design.md) §6 Phase 7
- Plan: TBD (brainstorm + plan in Phase 7)
- Tracker: [`../docs/superpowers/tracker.md`](../docs/superpowers/tracker.md)
