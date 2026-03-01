# 2026-03-01 — Dispatch/Kanban review follow-up fixes

## Summary

Implemented follow-ups from review findings across JTR-65/66/70/71 and aligned `saveTicket` update path with RxDB v16 guidance.

## Changes

- JTR-66 (kanban board):
  - Added missing `Canceled` column in board configuration so canceled tickets no longer disappear from board view.
  - Added explicit column color mapping in board config and passed color to `TicketKanbanColumn`.
- JTR-65 (kanban column):
  - Added optional `color` prop to `TicketKanbanColumn` to support spec-driven column dot coloring.
- JTR-70 (dispatch board):
  - Updated date matching in `useDispatchBoard` to compare scheduled ISO timestamps by UTC calendar day.
  - Updated weekly schedule grouping to use UTC date extraction from ISO timestamps.
  - Normalized internal week/date helper functions in `useDispatchBoard` to UTC-safe operations.
  - Aligned dispatch map's selected-day filter to UTC date extraction for consistency with board/timeline.
- JTR-71 (quick-assign modal):
  - Replaced plain technician select with `JListbox` custom option rendering including avatar, name, and job count.
  - Kept validation and payload behavior unchanged.
  - Extended technician option model with optional `avatarName`.
- Architecture follow-up:
  - Updated `useOfflineRepository.saveTicket()` update path to use `incrementalPatch` for existing tickets.
  - Kept create path as insert and preserved outbox payload semantics.

## Files

- `apps/web/pages/tickets/index.vue`
- `apps/web/components/domain/TicketKanbanColumn.vue`
- `apps/web/composables/useDispatchBoard.ts`
- `apps/web/components/dispatch/DispatchMapView.vue`
- `apps/web/components/domain/TicketQuickAssignModal.vue`
- `apps/web/components/ui/JListbox.vue`
- `apps/web/composables/useOfflineRepository.ts`
- `apps/web/types/ui.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/2026-03-01-dispatch-review-followups.md`
