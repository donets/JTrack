# JTR-42

- Date: 2026-02-27
- Scope: create layout state and breadcrumbs composables

## What changed

- Added `apps/web/composables/useLayoutState.ts`:
  - module-level refs: `sidebarCollapsed`, `mobileDrawerOpen`
  - exported setters and toggle helpers for both layout flags
- Added `apps/web/composables/useBreadcrumbs.ts`:
  - module-level `breadcrumbs` ref
  - `setBreadcrumbs(items)` and `clearBreadcrumbs()`
  - derived `title` computed from the last breadcrumb item

## Files

- `apps/web/composables/useLayoutState.ts`
- `apps/web/composables/useBreadcrumbs.ts`
- `docs/changelog/JTR-42.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
