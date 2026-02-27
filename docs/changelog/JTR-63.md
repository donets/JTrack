# JTR-63

- Date: 2026-02-27
- Scope: enforce RBAC access on Team routes

## What changed

- Added page-level RBAC checks on:
  - `apps/web/pages/team/index.vue`
  - `apps/web/pages/team/[id].vue`
- Guard behavior:
  - requires `users.read` to access Team pages
  - redirects unauthorized users to `/dashboard`
  - shows warning toast on redirect
- Preserved action-level permissions:
  - invite controls remain gated by `users.manage`
  - role-change controls remain gated by owner/admin + `users.manage`
- Updated UI plan task matrix to mark `JTR-63` as complete.

## Files

- `apps/web/pages/team/index.vue`
- `apps/web/pages/team/[id].vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-63.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
