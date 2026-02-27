# JTR-24

- Date: 2026-02-27
- Scope: add reusable UIButton component for UI kit

## What changed

- Added `JButton` component at `apps/web/components/ui/JButton.vue`.
- Implemented required props and defaults:
  - `variant`: `primary|secondary|ghost|danger`
  - `size`: `sm|md|lg`
  - `loading`, `disabled`, `type`
- Added variant styles matching UI requirements:
  - primary mint
  - secondary white + border
  - ghost text-only with mist hover
  - danger rose
- Added loading state with inline spinner, icon slot support, and disabled behavior while loading.

## Files

- `apps/web/components/ui/JButton.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
