# 2026-03-02 — Dispatch Skeleton Loading State

## What changed
- Added `DispatchSkeleton` component for `/dispatch` route to keep UI responsive during startup hydration.
- Reworked `apps/web/pages/dispatch.vue` access flow from blocking top-level `await enforceDispatchAccess()` to non-blocking async resolution.
- While dispatch permission/context is resolving, route now renders skeleton instead of delaying render.
- Dispatch tabs and panels (`board/timeline/map`) are shown only after access check passes.

## Files
- `apps/web/components/dispatch/DispatchSkeleton.vue`
- `apps/web/pages/dispatch.vue`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/changelog/2026-03-02-dispatch-skeleton-loading.md`

## Verification
- `pnpm --filter @jtrack/web typecheck`
- `pnpm --filter @jtrack/web lint`
