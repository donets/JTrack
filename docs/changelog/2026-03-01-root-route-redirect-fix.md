# 2026-03-01 — Root route redirect blank page fix

## Summary
- Replaced root page redirect implementation in `apps/web/pages/index.vue`.
- Switched from client-side `router.replace('/dashboard')` to a named route middleware `root-redirect`.
- Kept a minimal fallback template so the route always has deterministic render output before redirect.

## Why
- Navigating to `/` could leave a blank page until hard reload.
- Named middleware keeps the route-guard style and is emitted consistently in this SPA+prerender build.

## Files
- `apps/web/pages/index.vue`
- `apps/web/middleware/root-redirect.ts`
