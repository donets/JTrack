# 2026-03-02 — Dev Offline Toggle for Web PWA

## What changed
- Added `NUXT_PUBLIC_ENABLE_DEV_OFFLINE` toggle to control dev/offline behavior in web runtime.
- When enabled (`true`), local SW/cache reset plugin is skipped and app registers dedicated `public/dev-offline-sw.js` for dev shell/static caching.
- Default dev behavior now enables offline SW unless explicitly disabled (`NUXT_PUBLIC_ENABLE_DEV_OFFLINE=false`), reducing config drift between local runs.
- Web docker-compose services now read `../.env` (`env_file`) so local toggle value is actually applied to the running `web` container.
- Kept `@vite-pwa` dev mode disabled to avoid intermittent `ENOENT ... .nuxt/dev-sw-dist/sw.js` failures seen during Nuxt restarts.
- Updated auth bootstrap/middleware offline behavior to keep snapshot-backed access while offline (no forced redirect to `/login` on refresh failure when network is down).
- Added a strict dev-offline middleware bypass: when offline + `NUXT_PUBLIC_ENABLE_DEV_OFFLINE=true`, auth/location redirects are suppressed to keep cached routes accessible.
- Updated custom dev SW cache strategy for static assets to `network-first` (with offline fallback) and bumped cache epoch to avoid stale middleware/client bundle reuse.
- Added shell-route and asset warm-up during SW install (`/`, `/login`, `/dashboard`, `/tickets`, `/locations`, `/dispatch`) plus `ignoreSearch` cache matching to make offline hard-refresh resilient when query params vary.
- Added one-time page reload after SW registration when controller is not yet attached, so offline navigation works without manual second refresh.
- Persisted and restored location memberships snapshot (`jtrack.locationMemberships`) so offline dashboard keeps location context instead of showing empty location state.

## Files
- `apps/web/nuxt.config.ts`
- `apps/web/plugins/sw-reset.client.ts`
- `apps/web/plugins/dev-offline-sw.client.ts`
- `apps/web/public/dev-offline-sw.js`
- `apps/web/stores/auth.ts`
- `apps/web/middleware/auth.global.ts`
- `apps/web/stores/auth.spec.ts`
- `apps/web/stores/location.ts`
- `apps/web/stores/location.spec.ts`
- `apps/web/plugins/sync.client.ts`
- `.env.example`
- `docker/docker-compose.yml`
- `docker/docker-compose.dev.yml`
- `docs/architecture.md`
- `docs/system-design.md`

## Verification
- `pnpm --filter @jtrack/web lint`
- `pnpm --filter @jtrack/web typecheck`
