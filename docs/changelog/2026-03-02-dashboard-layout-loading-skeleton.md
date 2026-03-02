# 2026-03-02 Dashboard Layout Loading Skeleton

## Scope
- Keep app shell visible during client startup.
- Add dashboard skeleton while location/role context is loading.

## Changes
- Updated `/Users/vlad/Projects/JTrack/apps/web/plugins/sync.client.ts`:
  - removed blocking plugin startup path (`await` chain during Nuxt plugin init),
  - moved auth/location/sync bootstrap into background async task,
  - retained periodic and online-triggered sync behavior.
- Added `/Users/vlad/Projects/JTrack/apps/web/components/dashboard/DashboardSkeleton.vue`:
  - structured skeleton for stat cards and dashboard content sections.
- Updated `/Users/vlad/Projects/JTrack/apps/web/pages/dashboard.vue`:
  - renders `DashboardSkeleton` for authenticated users while auth bootstrap/location context resolves,
  - keeps existing role-based dashboard rendering unchanged after context is ready.

## Docs
- Updated `/Users/vlad/Projects/JTrack/docs/architecture.md`.
- Updated `/Users/vlad/Projects/JTrack/docs/system-design.md`.

## Verification
- `pnpm --filter @jtrack/web typecheck`
- `pnpm --filter @jtrack/web lint`
