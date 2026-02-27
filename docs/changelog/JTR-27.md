# JTR-27

- Date: 2026-02-27
- Scope: add reusable badge component for statuses, priorities, and roles

## What changed

- Added `JBadge` component at `apps/web/components/ui/JBadge.vue`.
- Implemented props:
  - `variant`: `mint | flame | sky | rose | violet | mist`
  - `size`: `sm | md`
- Added variant color mappings aligned with UI mockups:
  - `mint`, `flame`, `sky`, `rose`, `violet`, `mist`
- Added compact pill sizing for `sm` and default pill sizing for `md`.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JBadge.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
