# 2026-03-02 — Disable Throttling in Dev/Non-Prod

## What changed
- Updated API throttler config to skip request throttling when `NODE_ENV` is not `production`.
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
