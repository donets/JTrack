# JTR-22

- Date: 2026-02-25
- Scope: prevent cross-location accumulation/leakage in local RxDB data

## What changed

- Added location-switch cleanup in `location` store:
  - when active location changes, client prunes non-active location records from RxDB collections
  - cleaned collections: `tickets`, `ticketComments`, `ticketAttachments`, `paymentRecords`, `outbox`, `pendingAttachmentUploads`
  - removes stale sync checkpoints in `syncState` (keeps only active location checkpoint)
- Hardened ticket details streams to always scope by active `locationId`:
  - ticket query now filters by `{ id, locationId }`
  - comments/attachments streams now include `locationId` filter
  - prevents rendering stale records from previously visited locations
- Added tests for location-store cleanup behavior and active-location switch persistence.
- Updated architecture/system design docs and added task changelog.

## Files

- `apps/web/stores/location.ts`
- `apps/web/stores/location.spec.ts`
- `apps/web/pages/tickets/[id].vue`
- `docs/architecture.md`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
