# 2026-02-27 — AuthGuard login redirects

## Summary

- Unified frontend auth-guard redirects: unauthenticated access to protected routes now always redirects to `/login`.

## Changes

- Added shared public route helper:
  - `/Users/vlad/Projects/JTrack/apps/web/utils/public-routes.ts`
- Updated global auth middleware:
  - `/Users/vlad/Projects/JTrack/apps/web/middleware/auth.global.ts`
  - redirects protected routes to `/login?redirect=<target>`
- Updated API client auth-failure handling:
  - `/Users/vlad/Projects/JTrack/apps/web/composables/useApiClient.ts`
  - when request returns `401` and refresh fails, redirects from protected route to `/login?redirect=<current>`
- Updated login success flow:
  - `/Users/vlad/Projects/JTrack/apps/web/pages/login.vue`
  - consumes `redirect` query and navigates back to original protected route after successful login (with safe same-origin path check)
- Updated docs:
  - `/Users/vlad/Projects/JTrack/docs/architecture.md`
  - `/Users/vlad/Projects/JTrack/docs/auth.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
