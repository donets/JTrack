# JTR-70

- Date: 2026-03-01
- Scope: full dispatch page rewrite with board/timeline tabs and RBAC guard

## What changed

- Replaced `apps/web/pages/dispatch.vue` placeholder with full dispatch experience:
  - tabs: `Board`, `Timeline`, `Map` (placeholder until JTR-151)
  - query sync: `tab` + `date`
  - board tab composition:
    - `DispatchTimeGrid`
    - `DispatchGanttRow` per technician
    - `DispatchUnassignedSidebar`
    - `TicketQuickAssignModal`
  - timeline tab:
    - weekly technician schedule matrix based on shared dispatch data source
  - drag/drop scheduling:
    - unassigned ticket dropped on technician row updates assignment + schedule
  - quick-assign flow:
    - technician + time + duration assignment persisted through repository

- Added `apps/web/composables/useDispatchAccessGuard.ts`:
  - checks `dispatch.manage` privilege
  - unauthorized users get warning toast and redirect to `/dashboard`

- Added `apps/web/composables/useDispatchBoard.ts`:
  - RxDB ticket subscription scoped by active location
  - technician loading from `useTeamStore` (`role=Technician`, `membershipStatus=active`)
  - derived data for:
    - daily board rows
    - unassigned sidebar list
    - weekly timeline buckets
    - quick-assign technician options
  - assignment methods:
    - `assignDroppedTicket`
    - `assignTicket`

- Updated Epic 6 task matrix entry in `docs/plans/ui-ux-plan.md` to mark `JTR-70` as completed.

## Files

- `apps/web/pages/dispatch.vue`
- `apps/web/composables/useDispatchAccessGuard.ts`
- `apps/web/composables/useDispatchBoard.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-70.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
