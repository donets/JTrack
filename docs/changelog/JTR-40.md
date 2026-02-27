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

## Review follow-up (2026-02-27)

- Fixed date-only timezone shift bug:
  - `JDatePicker` now emits `YYYY-MM-DD` when `includeTime=false` instead of forcing `T00:00:00.000Z`.
  - input parsing now preserves date-only and ISO-backed values without day rollback in west-of-UTC timezones.
- Added form-field accessibility and structure hardening:
  - single root wrapper (no fragment `$attrs` warning)
  - `aria-invalid` + `aria-describedby` wiring for validation state
  - replaced internal UID generation with `useId()`.
