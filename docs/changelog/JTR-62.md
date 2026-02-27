# JTR-62

- Date: 2026-02-27
- Scope: implement team member detail page

## What changed

- Added route `apps/web/pages/team/[id].vue`.
- Implemented required two-column layout:
  - left: tabbed content (`Jobs` / `Activity`)
  - right: member profile card with avatar, role/status badges, contact details, and stats
- Added Jobs tab with `JTable` over member-assigned tickets from RxDB.
- Added Activity tab with `JTimeline` from member comments and recent ticket status events.
- Added owner-only role change control (plus admin bypass) with `JSelect` + save action backed by `teamStore.updateMemberRole`.
- Added breadcrumb integration and graceful empty-state when member is not found.
- Updated UI plan task matrix to mark `JTR-62` as complete.

## Files

- `apps/web/pages/team/[id].vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-62.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
