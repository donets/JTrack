# JTR-56

- Date: 2026-02-27
- Scope: implement owner/manager dashboard view

## What changed

- Added `apps/web/components/dashboard/OwnerManagerDashboard.vue`.
- Implemented owner/manager dashboard sections based on `useDashboardStats`:
  - KPI stat cards (open jobs, due today, completed MTD, revenue MTD)
  - job status distribution stacked bar + legend
  - unassigned jobs table
  - team availability list
  - recent activity timeline
- Updated `apps/web/pages/dashboard.vue` to render `OwnerManagerDashboard`.
- Kept technician block as explicit placeholder for the next Epic task.
- Updated UI plan task matrix to mark `JTR-56` as completed.

## Files

- `apps/web/components/dashboard/OwnerManagerDashboard.vue`
- `apps/web/pages/dashboard.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-56.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
