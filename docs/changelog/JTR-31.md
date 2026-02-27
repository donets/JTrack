# JTR-31

- Date: 2026-02-27
- Scope: add global toast notification system

## What changed

- Added `useToast` composable at `apps/web/composables/useToast.ts`:
  - API: `show({ message, type, duration })`
  - supported types: `success | error | warning | info`
  - auto-dismiss with per-toast timeout (default `4000ms`)
  - manual dismiss and clear helpers
- Added `JToast` renderer at `apps/web/components/ui/JToast.vue`:
  - fixed top-right stack
  - color mapping by toast type (`mint/rose/flame/sky`)
  - close button per toast and entry/exit transition
  - rendered via `<Teleport to="body">`
- Added `apps/web/layouts/default.vue` and mounted `<JToast />` there.
- Updated `apps/web/app.vue` to use `<NuxtLayout><NuxtPage /></NuxtLayout>` so layout-level toast mounting is active.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/composables/useToast.ts`
- `apps/web/components/ui/JToast.vue`
- `apps/web/layouts/default.vue`
- `apps/web/app.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
