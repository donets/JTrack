# JTR-67

- Date: 2026-03-01
- Scope: implement reusable dispatch day time-grid with navigation and current-time indicator

## What changed

- Added `apps/web/components/domain/DispatchTimeGrid.vue`:
  - hourly grid columns for day range `07:00–19:00` (configurable)
  - date navigation controls: previous day, today, next day
  - emits deterministic navigation events:
    - `update:date`
    - `navigate` with `{ date }`
  - current-time red indicator shown only when selected date is today
  - horizontal scroll-ready layout via fixed-width grid columns
  - slot API to render technician/job rows aligned to the exact same grid
- Added `DispatchTimeGridContext` to `apps/web/types/ui.ts` for typed slot/range integration.
- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-67` as completed.

## Files

- `apps/web/components/domain/DispatchTimeGrid.vue`
- `apps/web/types/ui.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-67.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
