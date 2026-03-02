# 2026-03-02 — Throttler 429 Message Cleanup

## What changed
- Configured Nest throttler to return `Too Many Requests` without the `ThrottlerException:` prefix.

## Files
- `apps/api/src/app.module.ts`
- `docs/system-design.md`

## Verification
- `pnpm --filter @jtrack/api lint`
- `pnpm --filter @jtrack/api typecheck`
