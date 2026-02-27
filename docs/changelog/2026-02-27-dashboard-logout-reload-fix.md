# 2026-02-27 — Dashboard reload + logout redirect fix

## Summary

- Fixed two web auth/navigation issues:
  - direct reload of `/dashboard` could return `404: NOT_FOUND` on static hosting
  - logout from dashboard could fail to navigate to `/login` if local DB cleanup threw

## Changes

- Updated `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts`:
  - added `'/dashboard': { prerender: true }`
- Updated logout flows to always continue to navigation:
  - `/Users/vlad/Projects/JTrack/apps/web/components/layout/AppTopbar.vue`
  - `/Users/vlad/Projects/JTrack/apps/web/components/AppShell.vue`
  - both now:
    - clear auth/location/sync state in `finally`
    - catch `destroyDatabase()` failures without aborting redirect
    - always call `navigateTo('/login')`
- Updated deployment note in `/Users/vlad/Projects/JTrack/docs/architecture.md`.

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/web build:mobile`
- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
