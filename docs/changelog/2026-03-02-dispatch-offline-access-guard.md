# 2026-03-02 — Dispatch Offline Access Guard Hydration

## What changed
- Hardened `useDispatchAccessGuard()` to avoid false `"You do not have permission to access Dispatch."` on offline page reloads.
- Guard now restores persisted auth snapshot (`authStore.restoreState()`) before evaluating `dispatch.manage`.
- Guard now restores cached location memberships when offline context is detected (`navigator.onLine=false`, `offlineSession=true`, or snapshot user without active access token), then re-evaluates privilege.
- Online authenticated path still loads memberships from API before final privilege decision.

## Tests
- Added unit tests for `useDispatchAccessGuard` covering:
  - offline reload hydration path (`restoreState` + cached memberships),
  - online authenticated hydration via `loadLocations`,
  - deny path with warning toast + redirect.

## Files
- `apps/web/composables/useDispatchAccessGuard.ts`
- `apps/web/composables/useDispatchAccessGuard.spec.ts`
- `apps/web/vitest.config.ts`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/changelog/2026-03-02-dispatch-offline-access-guard.md`

## Verification
- `pnpm --filter @jtrack/web test`
- `pnpm --filter @jtrack/web typecheck`
