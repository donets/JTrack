# JTR-69

- Date: 2026-03-01
- Scope: create dispatch unassigned tickets sidebar with search and mobile collapse

## What changed

- Added `apps/web/components/domain/DispatchUnassignedSidebar.vue`:
  - unassigned ticket header with count badge
  - in-sidebar search that filters only unassigned list items
  - mobile collapse/expand toggle (`Show`/`Hide`)
  - scrollable ticket list for dense dispatch days
  - reusable event forwarding:
    - `drag-start`
    - `open-ticket`
    - `quick-assign`
  - uses `TicketKanbanCard` with `showTicketCode=true` (dispatch default is visible code)

- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-69` as completed.

## Files

- `apps/web/components/domain/DispatchUnassignedSidebar.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-69.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
