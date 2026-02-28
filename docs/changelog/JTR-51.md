# JTR-51

- Date: 2026-02-27
- Scope: add role-based ticket status transition workflow on ticket detail page

## What changed

- Implemented role-aware status transitions in `apps/web/pages/tickets/[id].vue`:
  - Technician: `New -> InProgress`, `Scheduled -> InProgress`, `InProgress -> Done`
  - Manager: all transitions except any transition to `Paid`
  - Owner: all transitions
- Wired status dropdown to show only valid next statuses for the active role.
- Added transition guards in `updateTicketStatus()` with warning toast on forbidden transitions.
- Added success/error toast feedback for status updates.
- Added `statusEvents` timeline entries so each successful transition appears immediately as a `status_change` activity event.
- Updated mobile `Start Job` and topbar `Cancel` button enable/disable behavior to respect allowed transitions.
- Updated UI plan task matrix to mark `JTR-51` as completed.

## Files

- `apps/web/pages/tickets/[id].vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-51.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
