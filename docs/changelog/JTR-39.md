# JTR-39

- Date: 2026-02-27
- Scope: add progress and checkbox primitives

## What changed

- Added `JProgress` at `apps/web/components/ui/JProgress.vue`:
  - props: `value`, `max` (default `100`), `variant` (`mint|flame|sky`)
  - clamps value and renders percentage fill width
  - accessible `progressbar` attributes
- Added `JCheckbox` at `apps/web/components/ui/JCheckbox.vue`:
  - props: `modelValue`, `label?` (plus `id?/disabled?`)
  - full `v-model` support via `update:modelValue`
  - styled checkbox with checkmark icon and checked state
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JProgress.vue`
- `apps/web/components/ui/JCheckbox.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
