# logistics-web — Repo Guide

> Customer + driver + admin SPA for the AI Logistics platform. React 18 + Vite + TypeScript + Tailwind + shadcn/ui. Deployed to Vercel.

**Phase:** 7 (Web Frontend)
**Status:** 🟢 **`v0.4.0` shipped** (Plan 1 foundation + Plan 2 customer orders + Plan B customer live tracking + Plan C driver app). The two-sided tracking loop (customer consumes, driver produces) is now exercisable end-to-end through the UI. Admin app + notification frontend come after.

## What this app does

One single-page app, three role-gated views (route-level guards on the JWT role claim — the client gate is UX only; real authz is server-side):
- **Customer**: register / login, place an order, view + filter order history, view order detail + cancel, manage profile + addresses, track in real time, notifications.
- **Driver**: log in, toggle availability, accept/reject dispatches, live active-delivery (the real location producer), mark delivered.
- **Admin**: order monitoring, driver management, delivery analytics, manual dispatch override.

## What's shipped so far

- **Plan 1 — Foundation (`v0.1.0`)**: Vite/TS/Tailwind/shadcn scaffold; the **auth BFF** (3 Vercel functions `api/auth/{login,refresh,logout}` — httpOnly refresh cookie, access token in memory); the typed `fetchClient` (auth injection + **single-flight 401 refresh**) + `ApiError` (RFC 7807); Zustand auth store; React Router v7 with `<RequireRole>`; login/register screens; CI (lint + typecheck + Vitest + build) + one Playwright role-gate smoke.
- **Plan 2 — Customer Orders core (`v0.2.0`)**: the customer order-management slice — Home (active-delivery banner + recent orders + CTA), Place Order (inline pickup + saved-address dropoff with inline add-address + free-text items + advisory schedule), My Orders (cursor pagination + status filter), Order Detail (status timeline + items + addresses + conditional cancel). React Query hooks over the typed client; multi-service `gen:api` (auth + order + user types). Plus a Playwright customer happy-path E2E.
- **Plan B — Customer Live Tracking (`v0.3.0`)**: the `/track/:orderId` screen (customer-gated) — REST seed (`route` + `latest`) + a Socket.IO client (`features/tracking/use-tracking-socket`) consuming `driver:location`/`delivery:in_transit`/`delivery:completed`, a dark MapLibre map (`react-map-gl/maplibre`) with an indigo breadcrumb + driver/dropoff markers, a lifecycle badge, and a naive haversine ETA. Entry points: the Home active banner Track button + an Order Detail Track button (shown for `assigned`/`in_transit`). The `features/tracking/` module is reused (producing) by the Driver app in Plan C.
- **Plan C — Driver app (`v0.4.0`)**: the `driver`-gated app — `/driver` Today (profile-complete gate via `PATCH /v1/users/me/driver`, availability toggle via `PUT /v1/users/me/availability`, ~3s polling of `GET /v1/dispatch/offers/current`), `/driver/offers` (order-summary card + TTL countdown + accept/reject `POST /v1/dispatch/assignments/:id/{accept,reject}`), and `/driver/active/:orderId` which **reuses `features/tracking/`'s socket client to *produce*** `delivery:pickup` / `location:update` (from `navigator.geolocation.watchPosition`) / `delivery:complete` on the same dark MapLibre map. Active-order id persisted locally (`driver-active-store`). The two-sided tracking loop (customer consumes, driver produces) is now exercisable end-to-end.

## Locked decisions (from the Web spec — 2026-06-11)

- **Scope:** full three-role app (customer · driver · admin), built in sequenced shippable installments.
- **Design system:** shadcn/ui (Radix + Tailwind), direction A (light slate + indigo); concrete visual polish is owned by the `ui-ux-pro-max` skill (screens land as functional, behavior-tested baselines first).
- **Routing:** React Router v7, route-level role guards (`<RequireRole>`).
- **State:** React Query (server state) + Zustand (auth + UI).
- **Forms:** react-hook-form + Zod. Pattern: **string-typed form values + an explicit `toXxxRequest` converter** to the numeric API shape (sidesteps `z.coerce`/RHF input-output generic friction; converters are unit-tested). Native `<select>` (not radix Select) for simple pickers/filters — reliably testable under jsdom.
- **Maps:** MapLibre GL JS + OpenFreeMap (dark canvas on tracking/dispatch) — arrives with the Live Tracking plan.
- **Realtime:** Socket.IO client; the driver app is the real location producer. **Tracking WS handshake passes the access token in the Socket.IO `auth` payload** (`io(url, { auth: { token } })`); client emits `room:join {orderId}`, server emits `driver:location {orderId,lat,lng,ts}`. `VITE_WS_URL` is the WS **origin** (e.g. `https://tracking.example.com`); the client sets the engine path to `/v1/tracking/socket.io/` explicitly (`io(VITE_WS_URL, { path: "/v1/tracking/socket.io/", auth: { token } })`).
- **Auth/session:** scoped BFF — 3 Vercel functions hold the refresh token in an httpOnly cookie; access token in Zustand memory; hard reload survives via silent refresh; single-flight refresh on 401.
- **API types:** `openapi-typescript` generating a **checked-in snapshot** (`src/shared/api/types/`). `gen:api` reads the OpenAPI from the **local sibling checkout** (`../logistics-contracts/openapi/*.yaml`), not the npm package — the published `@angelocp-01/logistics-contracts@0.7.0` ships only `dist/` + `schemas/` (no `openapi/`) and is `access:restricted`, so it can't feed generation and isn't a dependency here. CI/build use the committed snapshot and need no registry access. **Future contracts-repo cleanup:** add `openapi/` to the package `files[]` (and reconsider public access) so consumers can `gen:api` from `node_modules` without a sibling checkout. (Also: order-service `weightKg` is `number|null` at runtime but optional-not-nullable in the OpenAPI/generated type — frontend tolerates both; fix on the next contracts bump.)
- **Tests:** Vitest + RTL + MSW (unit/component) + Playwright (E2E smokes in CI; the cross-service full-loop is a local/manual showcase). No Storybook for V1.
- **Config deviation:** ESLint/Prettier are **web-flavored (React-aware) flat configs vendored in this repo**, NOT the Node-service copies from `logistics-infrastructure/shared/`. The tsconfig is a Vite/React project-references config (`tsconfig.{app,node}.json` with `noEmit`), not the Node base.

## Structure (actual)

```
api/auth/{login,refresh,logout}.ts   # Vercel serverless — the auth BFF (+ _shared.ts)
src/
  app/
    App.tsx · main.tsx               # root + session bootstrap gate
    routes/                          # router.tsx, require-role.tsx, role-home.ts
    shell/app-shell.tsx              # role-aware nav + logout
    driver/ · admin/                 # placeholder homes (filled by later plans)
    not-found.tsx · forbidden.tsx · error-element.tsx
  features/
    auth/                            # auth-store, session, login/register pages, schemas
    orders/                          # types, hooks (use-my-orders/use-order/use-active-order/use-place-order/use-cancel-order),
                                     #   order-status badge, order-schema, place-order/my-orders/order-detail pages, order-card, cancel dialog
    addresses/                       # types, use-addresses/use-create-address, address-picker, address-schema
    home/                            # customer-home
    tracking/                        # tracking-types, eta, use-tracking-seed, use-tracking-socket (consumes AND produces), tracking-map, track-page
    driver/                          # hooks (use-my-profile, use-update-driver-profile, use-set-availability, use-current-offer, use-assignment, use-accept-offer, use-reject-offer, use-geolocation-stream),
                                     #   store (driver-active-store), screens (today, offers, active-delivery), offer-countdown, availability-toggle, driver-profile-form
  shared/
    api/                            # client (api singleton), fetch-client, api-error, query-client, query-keys, types/ (generated)
    ui/                             # shadcn atoms (button,input,label,card,badge,skeleton,dialog,table,textarea,separator)
    lib/                            # utils (cn), format
  test/                            # setup, msw-server, query-wrapper
tests/e2e/                         # Playwright (role-gate, customer-orders)
vite.config.ts · vitest.config.ts · tailwind.config.ts · vercel.json · components.json
```

> Feature-sliced: code that changes together lives together (a feature owns its types, hooks, schema, and screens). New features get a `src/features/<name>/` dir.

## Conventions

- Conventional Commits, trunk-based (`main` always deployable), per-repo SemVer tags (`v0.1.0`, `v0.2.0`, …).
- **All API calls go through React Query hooks built on the typed `api` client** (`src/shared/api/client.ts`). **No bespoke `fetch` in components or hooks.**
- Strict TS (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` → `import type` for type-only imports). No `any` (use `unknown` + narrow).
- Centralized query keys (`src/shared/api/query-keys.ts`); mutations invalidate the relevant keys.
- Every data-bound view defines loading (Skeleton) / empty / error states. RFC 7807 → `ApiError`; field errors via RHF, form-level via `ApiError.title`.
- Dialogs include a `<DialogDescription>` (radix a11y).

## Develop

```bash
npm install
cp .env.example .env        # GATEWAY_URL + VITE_* point at a running gateway
npm run gen:api             # regenerate the typed API snapshot from ../logistics-contracts/openapi (auth + order + user + dispatch service YAMLs)
npm run dev                 # plain Vite — note: the auth BFF functions need `vercel dev` (or a dev shim) to run locally
npm test                    # vitest
npm run test:e2e            # playwright (stubbed; no backend needed for the current smokes)
npm run lint && npm run typecheck && npm run build
```

> Local end-to-end auth needs the three `api/auth/*` serverless functions running — `npm run dev` (plain Vite) does not execute them; use `vercel dev`.

## Don't do

- Don't call internal services directly. Everything goes through the gateway via the same-origin `/api/*` surface.
- Don't bake the gateway URL into the build. Read it from `import.meta.env.VITE_API_BASE_URL` (SPA) / `GATEWAY_URL` (BFF functions).
- Don't store the refresh token in `localStorage`. httpOnly cookie (BFF) or in-memory access token only.
- Don't render role nav/areas for the wrong role — gate at the route level (`<RequireRole>`), not just on visibility.
- Don't add bespoke `fetch` calls; add a React Query hook on the `api` client.

## Pointers

- Spec: [`../docs/superpowers/specs/2026-06-11-web-frontend-design.md`](../docs/superpowers/specs/2026-06-11-web-frontend-design.md)
- Plans: [`../docs/superpowers/plans/2026-06-11-phase-7-web-foundation.md`](../docs/superpowers/plans/2026-06-11-phase-7-web-foundation.md) (Plan 1) · [`../docs/superpowers/plans/2026-06-11-phase-7-customer-orders.md`](../docs/superpowers/plans/2026-06-11-phase-7-customer-orders.md) (Plan 2) · [`../docs/superpowers/plans/2026-06-17-phase-7b-customer-live-tracking.md`](../docs/superpowers/plans/2026-06-17-phase-7b-customer-live-tracking.md) (Plan B) · [`../docs/superpowers/plans/2026-06-18-phase-7c-driver-app.md`](../docs/superpowers/plans/2026-06-18-phase-7c-driver-app.md) (Plan C)
- Tracker: [`../docs/superpowers/tracker.md`](../docs/superpowers/tracker.md)
