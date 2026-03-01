# JTR-65

- Date: 2026-03-01
- Scope: create kanban column component with drag-and-drop target behavior

## What changed

- Added `apps/web/components/domain/TicketKanbanColumn.vue`:
  - column shell with status header and reactive ticket count
  - scrollable card list composed from `TicketKanbanCard`
  - visible empty drop target when a column has no tickets
  - drag-over highlight state for clearer drop affordance
  - drop payload emit `{ ticketId, toStatus }`
  - event forwarding for `drag-start`, `open-ticket`, `quick-assign`
- Extended shared UI types in `apps/web/types/ui.ts` with `KanbanColumnItem` for board configuration.
- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-65` as completed.

## Follow-up (2026-03-01)

- Improved kanban drop-zone affordance in `TicketKanbanColumn`:
  - stronger active-state highlight (ring + background)
  - centered helper overlay label while dragging
  - drag-depth (`dragenter`/`dragleave`) tracking to prevent highlight flicker on nested drag events
- Added explicit default for optional `color` prop to satisfy component lint rule.

## Files

- `apps/web/components/domain/TicketKanbanColumn.vue`
- `apps/web/types/ui.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-65.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
