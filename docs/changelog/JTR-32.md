# JTR-32

- Date: 2026-02-27
- Scope: add reusable table component with sorting and loading states

## What changed

- Added `JTable` at `apps/web/components/ui/JTable.vue`.
- Implemented required props:
  - `columns`, `rows`
  - `sortable`, `loading`, `emptyText`
- Implemented `TableColumn` interface support:
  - `key`, `label`, `sortable`, `align`, `width`
- Added requested behavior:
  - scoped cell slots via `#cell-{key}`
  - sortable headers with arrow indicators
  - loading skeleton rows
  - empty state row with configurable message
- Added `sort-change` event with `{ key, direction }`.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JTable.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
