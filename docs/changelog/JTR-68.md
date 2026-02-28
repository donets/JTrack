# JTR-68

- Date: 2026-03-01
- Scope: create dispatch gantt row with absolute job blocks and drop-to-schedule interaction

## What changed

- Added `apps/web/components/domain/DispatchGanttRow.vue`:
  - technician identity cell (avatar, name, job count)
  - absolute-positioned job blocks from `scheduledStartAt/EndAt`
  - status-colored blocks for visual state recognition
  - row-level drag target for unassigned tickets
  - computes rounded start time from drop x-position
  - emits:
    - `ticket-drop` with `ticketId`, `technicianId`, `scheduledStartAt`, `scheduledEndAt`
    - `open-ticket` on job block click
- Added `apps/web/utils/scheduling.ts` with reusable scheduling helpers:
  - `timeToPositionPx`
  - `timeRangeToRectPx`
  - `positionPxToRoundedIso`
- Extended dispatch UI types in `apps/web/types/ui.ts`:
  - `DispatchGanttRowDropPayload`
  - `DispatchGanttRowOpenPayload`
- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-68` as completed.

## Files

- `apps/web/components/domain/DispatchGanttRow.vue`
- `apps/web/utils/scheduling.ts`
- `apps/web/types/ui.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-68.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
