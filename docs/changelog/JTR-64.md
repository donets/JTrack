# JTR-64

- Date: 2026-03-01
- Scope: create reusable kanban ticket card domain component

## What changed

- Added `apps/web/components/domain/TicketKanbanCard.vue` as a draggable kanban card with:
  - title, priority badge, assignee avatar/name
  - optional ticket code visibility via `showTicketCode` (default hidden)
  - optional due indicator derived from `dueAt`/`scheduledStartAt`
  - emitted events: `drag-start`, `open-ticket`, `quick-assign`
- Added shared kanban/dispatch UI contracts in `apps/web/types/ui.ts` including `KanbanTicketCardItem` and support fields used by the card (`dueAt`).
- Added `apps/web/utils/ticketVisuals.ts` with shared visual helpers:
  - status/priority badge mapping
  - ticket short-code formatter
  - ticket code visibility helper
- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-64` as completed.

## Files

- `apps/web/components/domain/TicketKanbanCard.vue`
- `apps/web/types/ui.ts`
- `apps/web/utils/ticketVisuals.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-64.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
