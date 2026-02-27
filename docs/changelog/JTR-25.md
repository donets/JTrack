# JTR-25

- Date: 2026-02-27
- Scope: add form input components for UI kit

## What changed

- Added `JInput` component at `apps/web/components/ui/JInput.vue`:
  - supports `v-model` (`modelValue` + `update:modelValue`)
  - supports props: `label`, `placeholder`, `error`, `type`, `id`
  - renders label above field and validation text below when `error` is provided
- Added `JTextarea` component at `apps/web/components/ui/JTextarea.vue`:
  - supports `v-model` (`modelValue` + `update:modelValue`)
  - supports props: `label`, `rows`, `placeholder`, `error`, `id`
  - renders label above field and validation text below when `error` is provided
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JInput.vue`
- `apps/web/components/ui/JTextarea.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
