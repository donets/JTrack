# JTR-18

- Date: 2026-02-25
- Scope: add API health-check endpoint for readiness/liveness probes

## What changed

- Added new public API endpoint: `GET /health`.
- Added `health` module in API (`HealthController`, `HealthService`) and wired it into `AppModule`.
- Health check now verifies DB connectivity with `SELECT 1` via Prisma:
  - returns `200` with `{ status: "ok", database: "up", version }` when DB is reachable
  - returns `503` with `{ status: "degraded", database: "down", version }` when DB is unavailable
- Added shared Zod contract `healthResponseSchema` and `HealthResponse` type in `packages/shared`.
- Added tests:
  - `apps/api/src/health/health.service.spec.ts`
  - `apps/api/src/health/health.controller.spec.ts`
  - `packages/shared/src/schemas.spec.ts` health response validation checks
- Updated API and architecture docs for the new health endpoint.

## Files

- `apps/api/src/app.module.ts`
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/health.controller.spec.ts`
- `apps/api/src/health/health.service.ts`
- `apps/api/src/health/health.service.spec.ts`
- `packages/shared/src/schemas.ts`
- `packages/shared/src/schemas.spec.ts`
- `docs/api-spec.yml`
- `docs/data-models.ts`
- `docs/architecture.md`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
