# JTR-45

- Date: 2026-02-27
- Scope: create topbar component for app shell

## What changed

- Added `apps/web/components/layout/AppTopbar.vue`.
- Implemented topbar structure:
  - mobile hamburger opening `mobileDrawerOpen`
  - breadcrumb trail and page title from `useBreadcrumbs`
  - sync indicator + “Sync now” action from `syncStore`
  - location switcher dropdown bound to `locationStore.memberships`
  - notification bell stub with unread dot
  - user menu dropdown with `Locations` and `Logout`
- Preserved existing logout flow from legacy `AppShell`:
  - `authStore.logout()`
  - `locationStore.clear()`
  - `syncStore.clearSyncData()`
  - RxDB destroy and redirect to `/login`
- Added optional `tabs` slot region below the topbar for feature-level tab navigation.

## Files

- `apps/web/components/layout/AppTopbar.vue`
- `docs/changelog/JTR-45.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
