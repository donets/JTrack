# JTR-40

- Date: 2026-02-27
- Scope: add reusable date/datetime picker component

## What changed

- Added `JDatePicker` at `apps/web/components/ui/JDatePicker.vue`.
- Implemented required props:
  - `modelValue` (ISO string)
  - `label?`
  - `min?`, `max?`
  - `includeTime?` (switches `date`/`datetime-local`)
  - `error?` support for validation state
- Added ISO ↔ input value conversion:
  - renders existing ISO values in native input format
  - emits ISO values on change
- Kept visual style aligned with `JInput` and added error messaging below field.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JDatePicker.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
