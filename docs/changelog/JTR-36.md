# JTR-36

- Date: 2026-02-27
- Scope: add reusable empty-state component

## What changed

- Added `JEmptyState` at `apps/web/components/ui/JEmptyState.vue`.
- Implemented required props:
  - `title` (required)
  - `description?`
  - `icon?`
  - `action?` (`{ label, to?, onClick? }`)
- Added centered empty-state layout with large icon, title, subtitle, and optional CTA.
- Action supports either:
  - route navigation via `NuxtLink` when `to` is provided
  - callback execution via `onClick`
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JEmptyState.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
