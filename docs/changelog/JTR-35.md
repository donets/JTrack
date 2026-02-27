# JTR-35

- Date: 2026-02-27
- Scope: add shared loading primitives for UI kit

## What changed

- Added `JSpinner` at `apps/web/components/ui/JSpinner.vue`:
  - SVG spinner with rotating animation
  - `size` prop: `sm (16px)`, `md (24px)`, `lg (40px)`
- Added `JSkeleton` at `apps/web/components/ui/JSkeleton.vue`:
  - `variant` prop: `text | circle | rect`
  - optional `width` and `height` overrides
  - pulse animation using Tailwind `animate-pulse`
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JSpinner.vue`
- `apps/web/components/ui/JSkeleton.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
