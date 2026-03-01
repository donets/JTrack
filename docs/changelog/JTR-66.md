# JTR-66

- Date: 2026-03-01
- Scope: add kanban board view to tickets page with query-sync and status drag-and-drop

## What changed

- Refactored `apps/web/pages/tickets/index.vue` to support two views with `JTabs`:
  - `All` (existing table view retained)
  - `Board` (new kanban view)
- Added route query synchronization for view selection:
  - `view=board` opens board tab
  - default `all` view omits query key
- Added kanban board rendering with `TicketKanbanColumn` for statuses:
  - `New`, `Scheduled`, `InProgress`, `Done`, `Invoiced`, `Paid`
- Implemented drag-and-drop status transitions in board view:
  - drop emit handled with `useOfflineRepository.saveTicket({ id, status })`
  - followed by `syncStore.syncNow()` and toast feedback
- Integrated `TicketQuickAssignModal` from kanban cards:
  - saves `assignedToUserId`, `scheduledStartAt`, `scheduledEndAt`
  - sets ticket status to `Scheduled`
  - success/error toast feedback
- Unified filter pipeline for both list and board views:
  - search + status filter + priority filter apply before list sorting and board grouping

## Files

- `apps/web/pages/tickets/index.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-66.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
