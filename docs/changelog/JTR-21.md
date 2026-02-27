# JTR-21

- Date: 2026-02-26
- Scope: restore local dev startup (`pnpm dev`)

## What changed

- Fixed API type mismatch that blocked NestJS watch compilation:
  - `apps/api/src/tickets/tickets.service.ts` now types serialized ticket `status` as `TicketStatus` instead of `string`.
- Recovered local database state to match current Prisma migrations:
  - reset local dev DB and reapplied current migrations + seed via Prisma reset flow.

## Files

- `apps/api/src/tickets/tickets.service.ts`
- `docs/changelog/JTR-21.md`

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm --filter @jtrack/api exec prisma migrate reset --force`
- `timeout 75s pnpm dev`
  - confirmed web served at `http://localhost:3000`
  - confirmed API started at `http://localhost:3001`
