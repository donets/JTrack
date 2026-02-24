# JTrack Monorepo

Production-oriented monorepo for a B2B field service CRM.

## Stack

- `apps/web`: Nuxt 4, Vue 3, Pinia, Tailwind, RxDB (offline-first), PWA-ready
- `apps/api`: NestJS, Prisma, PostgreSQL, JWT auth, location-scoped multi-tenancy
- `apps/mobile`: Capacitor wrapper for web build output
- `packages/shared`: Zod schemas, DTOs, role/privilege definitions, sync payload contracts
- `packages/eslint-config`, `packages/tsconfig`: shared tooling

## Monorepo Layout

```text
apps/
  api/
  web/
  mobile/
packages/
  shared/
  eslint-config/
  tsconfig/
docker/
  docker-compose.yml
```

## Quick Start

1. `cp .env.example .env`
2. `docker compose -f docker/docker-compose.yml up -d`
3. `pnpm install`
4. `pnpm --filter @jtrack/api prisma:generate`
5. `pnpm db:migrate`
6. `pnpm db:seed`
7. `pnpm dev`

Migration naming:
- default: `pnpm db:migrate` (Prisma prompts for a migration name when needed)
- explicit: `pnpm db:migrate -- --name your_migration_name`

Default services:
- Web: `http://localhost:3000`
- API: `http://localhost:3001`

Demo credentials:
- Owner user: `owner@demo.local` / `password123`
- Internal admin (`isAdmin: true`): `admin@jtrack.local` / `password123`

## Multi-Tenancy

- Every business record is location-scoped via `locationId`
- Protected API routes require `x-location-id`
- Access rules:
  - User must have active `UserLocation` membership for that location
  - Internal staff (`User.isAdmin = true`) bypass membership checks

## Auth

- Email/password login with JWT access + refresh tokens
- Refresh token is cookie-first (`httpOnly` cookie)
- Endpoints:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`

## RBAC

Roles are code-driven in `packages/shared` and mirrored into DB by seed.

- `Owner`: all privileges
- `Manager`: tickets/dispatch/users management, read-only payments, no billing writes
- `Technician`: assigned-ticket workflow, comments, attachments

Decorator/guard flow:
- `@RequirePrivileges([...])`
- `LocationGuard` enforces `x-location-id` + membership
- `PrivilegesGuard` resolves role in active location and checks privileges

## Offline + Sync Design

Web and Capacitor app both use RxDB (Dexie/IndexedDB) as local DB.

- UI reads from RxDB reactive queries
- Local writes go to RxDB first and enqueue mutation in `outbox`
- Sync service runs on app start, every 60s, on manual trigger, and on reconnect

### Sync Endpoints

- `POST /sync/pull`
  - Request: `{ locationId, lastPulledAt }`
  - Response: `{ changes, timestamp }`
- `POST /sync/push`
  - Request: `{ locationId, lastPulledAt, changes, clientId }`
  - Response: `{ ok: true, newTimestamp }`

`changes` includes:
- `tickets`
- `ticketComments`
- `ticketAttachments`
- `paymentRecords`

Each entity has `{ created: [], updated: [], deleted: [] }`.

### Conflict Strategy

Implemented strategy is **Option A: server-wins (LWW)**.

During `push`, if server row was updated after client `lastPulledAt`, incoming client mutation is skipped. Client then re-pulls and converges to server state.

## Attachments

- Provider interface supports S3-compatible implementations
- Local dev provider writes files to `UPLOAD_DIR` and serves them under `/uploads/*`
- Flow:
  1. Request presign (`/attachments/presign`)
  2. Upload payload (`/attachments/upload/:storageKey`)
  3. Store attachment metadata (`/attachments/metadata`)

## Capacitor Shell

Mobile app is intentionally thin and reuses web code.

Commands:
- `pnpm build:web:mobile`
- `pnpm cap:sync`
- `pnpm cap:open:ios`
- `pnpm cap:open:android`

`apps/mobile/capacitor.config.ts` points `webDir` to `../web/.output/public`.

## Root Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm build:web:mobile`
- `pnpm cap:sync`
- `pnpm cap:open:ios`
- `pnpm cap:open:android`
