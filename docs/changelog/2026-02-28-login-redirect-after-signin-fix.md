# 2026-02-28 — Login redirect after sign-in fix

## Summary

- Fixed case where user could stay on `/login` after successful sign-in.

## Changes

- Updated login page submit flow:
  - `/Users/vlad/Projects/JTrack/apps/web/pages/login.vue`
  - redirect now happens immediately after successful `authStore.login(...)`
  - location prefetch is non-blocking (`loadLocations()` runs in background and logs warning on failure)
  - added safe redirect guard to prevent redirecting back to `/login`
- Updated global auth middleware behavior for authenticated `/login`:
  - `/Users/vlad/Projects/JTrack/apps/web/middleware/auth.global.ts`
  - when already authenticated and `/login?redirect=...` is opened, middleware now respects safe redirect target instead of always forcing `/dashboard`
- Updated auth docs:
  - `/Users/vlad/Projects/JTrack/docs/auth.md`

## Verification

- `pnpm --filter @jtrack/web lint`
- `pnpm --filter @jtrack/web typecheck`
