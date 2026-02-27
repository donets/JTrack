# JTR-30

- Date: 2026-02-27
- Scope: add reusable modal component with accessibility behavior

## What changed

- Added `JModal` at `apps/web/components/ui/JModal.vue`.
- Implemented required props:
  - `modelValue` (boolean)
  - `title?` (string)
  - `size` (`sm|md|lg`) with widths `400px/520px/700px`
- Added required behaviors:
  - renders via `<Teleport to="body">`
  - backdrop overlay (`bg-black/40`)
  - closes on backdrop click and `Escape`
  - focus trap with `Tab`/`Shift+Tab` cycling
  - restores previous focus when modal closes
- Added accessibility attributes: `role="dialog"` and `aria-modal="true"`.
- Added `default` slot for body and `footer` slot for actions.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JModal.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
