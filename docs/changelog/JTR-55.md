# JTR-55

- Date: 2026-02-27
- Scope: implement dashboard aggregate composable backed by RxDB

## What changed

- Added `apps/web/composables/useDashboardStats.ts`.
- Implemented reactive subscriptions to RxDB collections scoped by active location:
  - `tickets`
  - `ticketComments`
  - `paymentRecords`
- Added owner/manager aggregates:
  - open jobs
  - due today (+ unassigned due today)
  - completed MTD
  - revenue MTD
  - status distribution
  - unassigned tickets list
  - team availability model
  - recent activity feed model
- Added technician "My Day" aggregates:
  - jobs today
  - completed today
  - remaining today
  - next job
  - ordered schedule rows
- Added best-effort team member loading via `/users` when role has `users.read` privilege.
- Updated UI plan task matrix to mark `JTR-55` as completed.

## Files

- `apps/web/composables/useDashboardStats.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-55.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
