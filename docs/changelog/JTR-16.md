# JTR-16

- Date: 2026-02-25
- Scope: extract shared date serializer and remove duplicated `toISOString()` mappings

## What changed

- Added shared recursive date serializer in `apps/api/src/common/date-serializer.ts`.
- Refactored API services to use `serializeDates(...)` instead of manual date field mapping:
  - `auth`
  - `comments`
  - `attachments`
  - `tickets`
  - `payments`
  - `locations`
  - `users`
  - `sync`
- Preserved auth response safety by explicitly whitelisting fields in `AuthService.toUserResponse` before serialization.
- Updated architecture and system design docs with the centralized date-serialization note.

## Files

- `apps/api/src/common/date-serializer.ts`
- `apps/api/src/common/date-serializer.spec.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/comments/comments.service.ts`
- `apps/api/src/attachments/attachments.service.ts`
- `apps/api/src/tickets/tickets.service.ts`
- `apps/api/src/payments/payments.service.ts`
- `apps/api/src/locations/locations.service.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/sync/sync.service.ts`
- `docs/architecture.md`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
