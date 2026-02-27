# JTR-23

- Date: 2026-02-27
- Scope: extend Tailwind design tokens for UI Kit foundation

## What changed

- Extended `apps/web/tailwind.config.ts` color tokens:
  - added `sky`, `rose`, `violet` with `DEFAULT` + `light` variants
  - converted `mint` and `flame` to token objects with `DEFAULT` + `light`
- Added layout spacing tokens:
  - `sidebar: 240px`
  - `sidebar-collapsed: 64px`
  - `topbar: 56px`
  - `bottom-nav: 64px`
- Synced UI planning docs with the new spacing token set.

## Files

- `apps/web/tailwind.config.ts`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
