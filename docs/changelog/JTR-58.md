# JTR-58

- Date: 2026-02-27
- Scope: add role-based dashboard view switching

## What changed

- Updated `apps/web/pages/dashboard.vue` to render dashboard content based on RBAC role:
  - `Owner` / `Manager` → `OwnerManagerDashboard`
  - `Technician` → `TechnicianDashboard`
  - unresolved role context → `JEmptyState`
- Added role-driven page heading and description:
  - technicians see `My Day`
  - owner/manager roles see `Dashboard`
- Switched breadcrumb setup to reactive role-aware updates via `watchEffect`.
- Updated UI plan task matrix to mark `JTR-58` as completed.

## Files

- `apps/web/pages/dashboard.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-58.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
