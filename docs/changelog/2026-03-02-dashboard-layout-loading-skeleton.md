# 2026-03-02 Dashboard Layout Loading Skeleton

## Scope
- Keep app shell visible during client startup.
- Add dashboard and tickets skeleton visibility while auth/location context is loading.
- Prevent stale-user protected UI render when `/auth/refresh` is throttled/fails.

## Changes
- Updated `/Users/vlad/Projects/JTrack/apps/web/plugins/sync.client.ts`:
  - removed blocking plugin startup path (`await` chain during Nuxt plugin init),
  - moved auth/location/sync bootstrap into background async task,
  - retained periodic and online-triggered sync behavior.
- Added `/Users/vlad/Projects/JTrack/apps/web/components/dashboard/DashboardSkeleton.vue`:
  - structured skeleton for stat cards and dashboard content sections.
- Updated `/Users/vlad/Projects/JTrack/apps/web/pages/dashboard.vue`:
  - renders `DashboardSkeleton` while auth bootstrap/location context resolves,
  - keeps existing role-based dashboard rendering unchanged after context is ready.
- Updated `/Users/vlad/Projects/JTrack/apps/web/middleware/auth.global.ts`:
  - removed blocking `await` flow for `authStore.bootstrap()` and `locationStore.loadLocations()`,
  - triggers background bootstrap/load and re-validates current route on completion,
  - preserves final auth/location redirects without blocking initial render.
- Updated `/Users/vlad/Projects/JTrack/apps/web/pages/tickets/index.vue`:
  - renders page-level `TicketsSkeleton` during bootstrap/hydration window.
- Updated `/Users/vlad/Projects/JTrack/apps/web/stores/auth.ts`:
  - deduplicates concurrent `refreshAccessToken()` calls,
  - deduplicates concurrent `bootstrap()` calls,
  - clears persisted user snapshot until refresh/session revalidation succeeds.
- Updated `/Users/vlad/Projects/JTrack/apps/web/stores/auth.spec.ts`:
  - added coverage for concurrent refresh dedupe,
  - added coverage that bootstrap does not expose persisted stale user before refresh resolves.
- Added `/Users/vlad/Projects/JTrack/apps/web/plugins/sw-reset.client.ts` and updated `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts`:
  - disables PWA SW in dev mode,
  - unregisters existing SW + clears caches on localhost/dev to avoid stale bundles (important for auth/rxdb hotfix rollout).

## Docs
- Updated `/Users/vlad/Projects/JTrack/docs/architecture.md`.
- Updated `/Users/vlad/Projects/JTrack/docs/system-design.md`.

## Verification
- `pnpm --filter @jtrack/web typecheck`
- `pnpm --filter @jtrack/web lint`
- `pnpm --filter @jtrack/web test -- stores/auth.spec.ts`
