# RXDB-DB6

- Date: 2026-03-02
- Scope: prevent app init crash on RxDB schema mismatch (`DB6`)

## What changed

- Updated web RxDB plugin to handle schema mismatch recovery on startup:
  - detects `DB6` errors during database creation,
  - removes stale local IndexedDB database,
  - recreates collections automatically.
- Keeps existing runtime behavior for non-`DB6` errors (rethrow).

## Docs updated

- `docs/architecture.md`
- `docs/system-design.md`

## Files

- `apps/web/plugins/rxdb.client.ts`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/changelog/RXDB-DB6.md`

## Verification

- `pnpm --filter @jtrack/web typecheck`
- `pnpm --filter @jtrack/web build`
