# JTR-44

- Date: 2026-02-27
- Scope: create sidebar component for app shell

## What changed

- Added `apps/web/components/layout/AppSidebar.vue`.
- Implemented desktop and mobile sidebar modes:
  - desktop expanded/collapsed structure
  - tablet icon-only behavior
  - mobile slide-in drawer with backdrop and close actions
- Added active-route highlighting and route-change auto-close for the mobile drawer.
- Added RBAC filtering for nav items via `useRbacGuard`.
- Added bottom user card and desktop collapse toggle, matching app-shell wireframe behavior.

## Files

- `apps/web/components/layout/AppSidebar.vue`
- `docs/changelog/JTR-44.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
