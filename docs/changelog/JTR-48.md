# JTR-48

- Date: 2026-02-27
- Scope: refactor `/tickets` list to JTable with filters, sorting, pagination, and URL query state

## What changed

- Rebuilt `apps/web/pages/tickets/index.vue` ticket list surface:
  - added filter bar with `JSearchInput`, `JSelect` filters (status/priority/assignee), and rows-per-page selector (25/50/100)
  - replaced native table with `JTable`
  - added sortable headers for `title`, `status`, `priority`, and `updatedAt`
  - added `JPagination` for client-side paging
  - moved filter/sort/page state to URL query params for shareable list state
- Updated RxDB subscription selector to include active filters (status/priority/assignee) on the client side.
- Added controlled sort mode to `apps/web/components/ui/JTable.vue` so pages can keep sort state in route/query and still use JTable header controls.
- Updated UI plan task matrix to mark `JTR-48` as completed.

## Files

- `apps/web/pages/tickets/index.vue`
- `apps/web/components/ui/JTable.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-48.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
