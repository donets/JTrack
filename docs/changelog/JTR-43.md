# JTR-43

- Date: 2026-02-27
- Scope: create RBAC guard composable for frontend privilege checks

## What changed

- Added `apps/web/composables/useRbacGuard.ts`.
- Implemented `hasPrivilege(key)` API backed by shared RBAC contracts from `@jtrack/shared`.
- Implemented role resolution flow:
  - uses `locationStore.activeLocation.role` for location-scoped role
  - treats `authStore.user.isAdmin` as owner-level access
  - safely handles unknown or missing role values
- Added `hasAnyPrivilege(keys)` helper and exposed computed active role + privilege list for layout and view guards.

## Files

- `apps/web/composables/useRbacGuard.ts`
- `docs/changelog/JTR-43.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
