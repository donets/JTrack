# 2026-03-02 — Throttling Bypass Scope (Dev/Test Only)

## What changed
- Updated API throttler config to skip request throttling only when:
  - `NODE_ENV=development`,
  - `NODE_ENV=test`,
  - or `AUTH_THROTTLE_DISABLED=true`.
- Kept `429` message format as `Too Many Requests` for production paths where throttling is active.
- Updated local compose API environment to `NODE_ENV=development` so local Docker runs actually bypass throttling.

## Files
- `apps/api/src/app.module.ts`
- `docker/docker-compose.yml`
- `docs/system-design.md`
- `docs/auth.md`

## Verification
- `pnpm --filter @jtrack/api lint`
- `pnpm --filter @jtrack/api typecheck`
