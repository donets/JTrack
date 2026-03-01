# JTR-71

- Date: 2026-03-01
- Scope: create reusable quick-assign modal for kanban and dispatch flows

## What changed

- Added `apps/web/components/domain/TicketQuickAssignModal.vue`:
  - modal form fields: technician, start datetime, duration (30/60/90/120 min)
  - required validation for technician and start datetime
  - normalized `submit` payload with ISO `scheduledStartAt` and computed `scheduledEndAt`
  - parent-controlled loading via `submitting` prop
  - parent-controlled success/error UX via emitted payload (no hidden side-effects)
- Extended shared UI types in `apps/web/types/ui.ts`:
  - `QuickAssignTechnicianOption`
- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-71` as completed.

## Files

- `apps/web/components/domain/TicketQuickAssignModal.vue`
- `apps/web/types/ui.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-71.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
