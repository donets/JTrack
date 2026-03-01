# 2026-03-01 — Root route redirect blank page fix

## Summary
- Replaced root page redirect implementation in `apps/web/pages/index.vue`.
- Switched from top-level `await navigateTo('/dashboard')` to client-side `router.replace('/dashboard')` in `onMounted`.
- Kept a minimal fallback template so the route always has deterministic render output before redirect.

## Why
- Navigating to `/` could leave a blank page until hard reload.
- In this SPA build, route-meta middleware on `index.vue` was not emitted to the client bundle, while `onMounted` redirect is deterministic.

## Files
- `apps/web/pages/index.vue`
