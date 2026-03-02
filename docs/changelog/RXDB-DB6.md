# RXDB-DB6

- Date: 2026-03-02
- Scope: prevent app init crash on RxDB schema mismatch (`DB6`)

## What changed

- Updated web RxDB plugin to handle schema mismatch recovery on startup:
  - detects `DB6` errors during database creation,
  - uses versioned primary database name (`jtrack_crm_v2`) to avoid reopening incompatible legacy schema state,
  - removes stale local IndexedDB database,
  - retries collection creation after reset,
  - falls back to dedicated recovery database name (`jtrack_crm_v2_recovery`) when delete/recreate remains blocked by stale handles,
  - applies last-resort unique emergency DB name when both primary and recovery names still hit `DB6`,
  - resets internal creation promise after failure so initialization can be retried without full app restart.
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
