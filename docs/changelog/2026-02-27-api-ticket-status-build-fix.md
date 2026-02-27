# API Ticket Status Build Fix

- Date: 2026-02-27
- Scope: fix Docker/API build failure caused by ticket list response typing

## What changed

- Fixed `apps/api/src/tickets/tickets.service.ts` typing in `serialize(...)`:
  - changed `status` from `string` to shared `TicketStatus`
- This aligns the service return type with `TicketListResponse` from `@jtrack/shared` and removes TS build error during `@jtrack/api` build in Docker.

## Files

- `apps/api/src/tickets/tickets.service.ts`
- `docs/changelog/2026-02-27-api-ticket-status-build-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api build`
- `docker-compose -f /Users/vlad/Projects/JTrack/docker/docker-compose.yml up -d --build`
