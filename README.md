# logistics-web

Customer + driver + admin SPA for the AI Logistics platform. React + Vite + Tailwind + shadcn/ui, deployed to Vercel.

## Develop
```bash
npm install
cp .env.example .env        # point GATEWAY_URL + VITE_* at a running gateway
npm run gen:api             # regenerate typed API surface from logistics-contracts
npm run dev
```

## Test
```bash
npm test            # vitest unit/component
npm run test:e2e    # playwright (stubbed smokes — no backend; the full-loop E2E is manual)
npm run lint && npm run typecheck
```

## Architecture
See [`../docs/superpowers/specs/2026-06-11-web-frontend-design.md`](../docs/superpowers/specs/2026-06-11-web-frontend-design.md).
Auth uses a scoped BFF: `api/auth/*` Vercel functions hold the refresh token in an httpOnly cookie; the SPA keeps only an in-memory access token.
