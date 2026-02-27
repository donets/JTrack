# JTR-41

- Date: 2026-02-27
- Scope: add reusable tabs component

## What changed

- Added `JTabs` at `apps/web/components/ui/JTabs.vue`.
- Implemented required props:
  - `tabs` (`{ key, label, count? }[]`)
  - `modelValue` (active tab key)
- Added active tab behavior with mint underline and active text color.
- Added optional count badge rendering next to tab labels.
- Added `v-model` support via `update:modelValue`.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JTabs.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
