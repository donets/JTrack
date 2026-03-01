# JTR-53

- Date: 2026-02-27
- Scope: centralize ticket/status/priority badge color mapping into a shared utility

## What changed

- Added `apps/web/utils/ticket-status.ts` with shared mapping helpers:
  - `statusToBadgeVariant(status)`
  - `priorityToBadgeVariant(priority)`
  - `roleToBadgeVariant(role)`
  - `statusToLabel(status)`
- Refactored `apps/web/composables/useDashboardStats.ts` to consume the shared utility instead of local duplicated mapping logic.
- Updated UI plan task matrix to mark `JTR-53` as completed.

## Files

- `apps/web/utils/ticket-status.ts`
- `apps/web/composables/useDashboardStats.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-53.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
