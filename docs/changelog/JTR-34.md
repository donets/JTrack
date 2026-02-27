# JTR-34

- Date: 2026-02-27
- Scope: add accessible dropdown menu component

## What changed

- Added `JDropdown` at `apps/web/components/ui/JDropdown.vue`.
- Implemented required API:
  - `items` with `{ label, icon?, action?, variant? }`
  - `align` (`left|right`)
  - `trigger` slot with control bindings (`open/close/toggle`)
- Implemented expected behavior:
  - positioned flyout menu
  - closes on outside click
  - keyboard navigation with `ArrowUp/ArrowDown`, `Enter`, `Escape`
  - active item focus management for keyboard users
- Added `danger` variant support for destructive actions.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JDropdown.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
