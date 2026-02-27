# JTR-37

- Date: 2026-02-27
- Scope: add metric/stat card UI component

## What changed

- Added `JStatCard` at `apps/web/components/ui/JStatCard.vue`.
- Implemented required props:
  - `label` (string)
  - `value` (`string | number`)
  - `trend?` (`{ value: number, direction: 'up' | 'down' }`)
  - `icon?` (string)
  - `valueColor?` (string)
- Added layout for dashboard-style metric cards:
  - label on top
  - large value text
  - optional icon
  - optional trend indicator with up/down arrow and semantic color
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JStatCard.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
