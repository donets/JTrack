# JTR-60

- Date: 2026-02-27
- Scope: implement team member list page

## What changed

- Replaced placeholder Team page with a full list view at `apps/web/pages/team/index.vue`.
- Added team member table with required columns:
  - `Member` (avatar + name link)
  - `Email`
  - `Role` (badge)
  - `Status` (badge)
  - `Last Active`
- Added list controls:
  - tabs `All / Active / Invited`
  - search filter by name/email
  - `+ Invite Member` action button
- Added initial invite modal open flow (modal shell) so the CTA already opens a dialog.
- Wired page data loading to `useTeamStore.fetchMembers()` with location-aware reload and toast error handling.
- Updated UI plan task matrix to mark `JTR-60` as complete.

## Files

- `apps/web/pages/team/index.vue`
- `apps/web/pages/team.vue` (removed)
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-60.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
