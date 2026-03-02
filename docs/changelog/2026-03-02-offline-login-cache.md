# 2026-03-02 — Offline Login Credential Cache

## What changed
- Added offline login fallback in web auth store:
  - after successful online login, client stores `jtrack.offlineLogin` snapshot with normalized email, random salt, PBKDF2-derived verifier, and user snapshot;
  - when browser is offline and `/auth/login` is unreachable, login verifies credentials against local verifier and restores user session snapshot.
- Fixed auth restore key usage to consistently read/write `jtrack.auth` through shared constant.
- Hardened logout/session cleanup: `clearState()` now also removes `jtrack.offlineLogin`.
- Login page now restores cached active location and location memberships immediately after sign-in, and only runs online location preload when access token exists.
- Added auth-store tests for:
  - successful offline login from cached credentials,
  - offline login rejection on wrong password.

## Files
- `apps/web/stores/auth.ts`
- `apps/web/pages/login.vue`
- `apps/web/stores/auth.spec.ts`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/auth.md`
- `docs/changelog/2026-03-02-offline-login-cache.md`

## Verification
- `pnpm --filter @jtrack/web test -- stores/auth.spec.ts stores/location.spec.ts`
- `pnpm --filter @jtrack/web typecheck`
- `pnpm --filter @jtrack/web lint`
