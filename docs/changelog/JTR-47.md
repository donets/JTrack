# JTR-47

- Date: 2026-02-27
- Scope: assemble default layout and migrate pages from legacy AppShell wrapper

## What changed

- Rebuilt `apps/web/layouts/default.vue` as the app-shell composition:
  - `AppSidebar` + `AppTopbar` + scrollable page slot + `AppBottomNav`
  - mounted `JToast` in layout
  - layout uses full-height desktop grid with sidebar + topbar rows
- Added `apps/web/layouts/auth.vue` for authentication pages.
- Migrated existing pages away from `<AppShell>` wrapper:
  - `pages/locations.vue`
  - `pages/dispatch.vue`
  - `pages/tickets/index.vue`
  - `pages/tickets/[id].vue`
- Added breadcrumb setup with `useBreadcrumbs` in migrated pages and new placeholders.
- Updated auth/index routing:
  - `pages/login.vue`: `definePageMeta({ layout: 'auth' })`
  - `pages/index.vue`: redirect to `/dashboard`
  - `middleware/auth.global.ts`: authenticated `/login` redirect now points to `/dashboard`
- Added route scaffolding used by app-shell navigation:
  - `pages/dashboard.vue` (shell-ready stub)
  - `pages/customers.vue`
  - `pages/quotes.vue`
  - `pages/invoices.vue`
  - `pages/team.vue`
  - `pages/inventory.vue`
  - `pages/reports.vue`
  - `pages/settings.vue`

## Files

- `apps/web/layouts/default.vue`
- `apps/web/layouts/auth.vue`
- `apps/web/pages/dashboard.vue`
- `apps/web/pages/customers.vue`
- `apps/web/pages/quotes.vue`
- `apps/web/pages/invoices.vue`
- `apps/web/pages/team.vue`
- `apps/web/pages/inventory.vue`
- `apps/web/pages/reports.vue`
- `apps/web/pages/settings.vue`
- `apps/web/pages/locations.vue`
- `apps/web/pages/dispatch.vue`
- `apps/web/pages/tickets/index.vue`
- `apps/web/pages/tickets/[id].vue`
- `apps/web/pages/login.vue`
- `apps/web/pages/index.vue`
- `apps/web/middleware/auth.global.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-47.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`

## Review Fixes (App Shell, 2026-02-27)

- Scope: address post-review critical issues and high-priority alignment gaps for Epic 2.

### What changed

- Fixed Tailwind purge risk for layouts:
  - added `./layouts/**/*.vue` to `apps/web/tailwind.config.ts` content paths.
- Fixed SSR cross-request state leaks:
  - `useLayoutState` migrated from module-level `ref(...)` singletons to request-safe `useState(...)`.
  - `useBreadcrumbs` migrated from module-level `ref(...)` singleton to request-safe `useState(...)`.
- Fixed auth layout usage:
  - added `definePageMeta({ layout: 'auth' })` to `signup`, `forgot-password`, `reset-password`, and `verify-email`.
  - moved auth-page centering responsibility to `layouts/auth.vue` and removed duplicate full-screen centering wrappers from auth pages.
- Fixed stale sync status indicator:
  - `AppTopbar` now uses a reactive `now` ref refreshed on interval so sync age and indicator color update over time.
- Applied important UI consistency updates:
  - sidebar active border changed to `3px` (`border-l-[3px]`).
  - offline sync-dot color aligned to orange (`flame`) instead of red.
  - added `Profile` item in topbar user menu.
  - added iOS safe-area bottom inset handling in `AppBottomNav`.
  - aligned invoice route to plan (`/invoicing`), updated sidebar nav target, and added `/invoices` redirect for backward compatibility.
  - replaced default layout magic numbers with explicit app-shell sizing vars for sidebar and mobile bottom-nav spacing.

### Files

- `apps/web/tailwind.config.ts`
- `apps/web/composables/useLayoutState.ts`
- `apps/web/composables/useBreadcrumbs.ts`
- `apps/web/layouts/default.vue`
- `apps/web/layouts/auth.vue`
- `apps/web/components/layout/AppSidebar.vue`
- `apps/web/components/layout/AppTopbar.vue`
- `apps/web/components/layout/AppBottomNav.vue`
- `apps/web/pages/login.vue`
- `apps/web/pages/signup.vue`
- `apps/web/pages/forgot-password.vue`
- `apps/web/pages/reset-password.vue`
- `apps/web/pages/verify-email.vue`
- `apps/web/pages/invoicing.vue`
- `apps/web/pages/invoices.vue`
- `docs/changelog/JTR-47.md`

### Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
