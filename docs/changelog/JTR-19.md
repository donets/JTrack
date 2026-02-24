# JTR-19

- Date: 2026-02-25
- Scope: prevent sync pull from echoing records just pushed by the same client cycle

## What changed

- Updated web sync flow (`apps/web/stores/sync.ts`):
  - after successful `POST /sync/push`, client now uses `pushResponse.newTimestamp` as `lastPulledAt` for the following `POST /sync/pull` in the same sync run
  - `clientId` is now sent in pull requests for explicit client-cycle correlation
- Extended shared sync pull contract (`packages/shared/src/sync.ts`): `SyncPullRequest` now supports optional `clientId`.
- Updated tests:
  - `apps/web/stores/sync.spec.ts` verifies pull requests use the post-push timestamp and include `clientId`
  - `packages/shared/src/sync.spec.ts` verifies optional pull `clientId` parsing
- Updated sync API/design documentation and data models.

## Files

- `apps/web/stores/sync.ts`
- `apps/web/stores/sync.spec.ts`
- `packages/shared/src/sync.ts`
- `packages/shared/src/sync.spec.ts`
- `docs/api-spec.yml`
- `docs/data-models.ts`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
