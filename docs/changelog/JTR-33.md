# JTR-33

- Date: 2026-02-27
- Scope: add debounced search input component

## What changed

- Added `JSearchInput` at `apps/web/components/ui/JSearchInput.vue`.
- Implemented required props:
  - `modelValue` (string)
  - `placeholder?` (string)
  - `debounce?` (number, default `300ms`)
- Added UI and behavior requirements:
  - search icon on the left
  - debounced `update:modelValue` emission
  - clear button shown when value is present
- Added timer cleanup on unmount to avoid stale emissions.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JSearchInput.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
