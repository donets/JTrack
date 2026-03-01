# JTrack Architecture

## 1. Overview
JTrack is a monorepo CRM platform with a web client, mobile shell, and a NestJS API backed by PostgreSQL.  
The architecture favors:
- clear domain modules,
- strict tenant scoping by location,
- offline-first client behavior with explicit server reconciliation.

## 2. Repository Structure
```text
apps/
  api/        # NestJS + Prisma + RBAC + sync
  web/        # Nuxt 4 + Pinia + RxDB
  mobile/     # Capacitor wrapper
packages/
  shared/     # Zod schemas + DTOs + RBAC constants + sync contracts
  eslint-config/
  tsconfig/
docker/
  docker-compose.yml
```

## 3. Container/Runtime View
```mermaid
flowchart LR
  U["User (Browser/Mobile)"] --> W["Nuxt Web App"]
  U --> M["Capacitor Shell"]
  M --> W
  W --> A["NestJS API"]
  A --> P["PostgreSQL"]
  A --> F["Local Upload Storage (/uploads)"]
  W --> R["RxDB (IndexedDB/Dexie)"]
```

For local Docker development, `docker/docker-compose.yml` runs the `web` service in `nuxt dev` mode with source bind-mounts, so UI changes hot-reload without rebuilding images.

## 4. API Layer (NestJS)
### 4.1 Module Boundaries
- `auth`: login/refresh/logout/me, invite onboarding completion, JWT issuance, refresh token rotation.
- `rbac`: role/privilege resolution and access checks.
- `locations`: tenant container lifecycle.
- `users`: membership and operator management (including per-location role/status updates through `PATCH /users/:id` with `x-location-id` context).
- `tickets`, `comments`, `attachments`, `payments`, `ticketActivities`: core domain CRUD and timeline events.
  - Ticket status transitions are validated server-side against shared role-based transition rules.
- `sync`: delta pull/push and conflict handling.
- `health`: readiness/liveness probe endpoint with DB connectivity check.
- `prisma`: DB access abstraction and lifecycle.

### 4.2 Cross-Cutting Guards
- `JwtAuthGuard`: validates bearer access token.
- `LocationGuard`: enforces `x-location-id` + active membership; for admin bypass, writes synthetic `locationRole=Owner` into request context.
- `PrivilegesGuard`: validates endpoint privilege set against role.
- `ZodValidationPipe`: validates request payloads at controller boundary (bound at parameter level, e.g. `@Body(new ZodValidationPipe(...))`) using shared schema contracts and normalizes JSON-stringified (including double-stringified) bodies before schema parse.
- `serializeDates` helper (`apps/api/src/common/date-serializer.ts`): centralizes `Date -> ISO string` conversion for API response mapping in service layer.

## 5. Data Architecture
- PostgreSQL as source of truth.
- Prisma schema defines:
  - enums for role/status/provider kinds,
  - referential integrity via foreign keys,
  - location-scoped sequential ticket numbering (`Ticket.ticketNumber`) for human-readable references,
  - ticket checklist persisted as JSON array on `Ticket.checklist` (`id`, `label`, `checked`),
  - immutable per-ticket activity log records (`TicketActivity`) for timeline/audit surfaces,
  - indexes tuned for location-scoped queries and sync windows.
- Soft-delete only where sync tombstones are required.
- User deletion is hard-delete with transactional session invalidation (`refreshTokenHash` reset) and reassignment of historical `createdBy`/`assignedTo`/`author`/`uploadedBy` references to a reserved non-admin system user to satisfy FK constraints.
- Location deletion is guarded by application checks: if any location-scoped business records exist, API returns conflict instead of attempting FK-breaking hard delete.

## 6. Client Architecture
### 6.1 Web App
- Nuxt 4 (Vue 3) for UI and routing.
- RxDB/Dexie as local reactive storage.
- Global route middleware protects non-public routes and redirects unauthenticated users to `/login?redirect=<target>`.
- RxDB v16 document writes use `incrementalPatch`/`incrementalModify` (not `atomicPatch`) for compatibility.
- Logout flow destroys local RxDB storage and immediately recreates a clean instance for same-tab re-login safety.
- Ticket detail timeline is composed on client from `ticketActivities` and `ticketComments` streams via `useTicketActivity`.
- Ticket detail checklist toggles are persisted through ticket patch updates (offline-first) and synchronized via outbox.
- Outbox pattern:
  - local mutation first,
  - enqueue operation,
  - background push + pull convergence.
- On active location switch, client prunes location-scoped RxDB records for non-active locations to prevent cross-tenant accumulation/leakage.
- Offline attachments are staged in RxDB (`pendingAttachmentUploads`) and converted to regular attachment outbox records after deferred upload when connectivity returns; base64 file payload is stored only in staging collection (attachment placeholder keeps pending metadata without duplicating file bytes).
- Ticket detail attachments UI separates image thumbnails (with preview modal) and file list metadata, with per-item soft-delete actions.
- Attachment upload zone supports drag-and-drop multi-file selection with per-file progress/status indicators and batch sync after completion.
- Dispatch map tab uses Leaflet with OpenStreetMap tiles for interactive job visualization.
- Until backend geo fields are introduced, map coordinates are deterministic mock points derived from `hash(ticketId + locationId)` inside a fixed viewport bounding box.

### 6.2 Mobile App
- Capacitor wraps web build output.
- Reuses same frontend and sync logic.

## 7. Sync and Data Flow
```mermaid
sequenceDiagram
  participant C as Client (RxDB)
  participant S as API /sync
  participant D as PostgreSQL

  C->>S: POST /sync/push (changes, lastPulledAt)
  S->>D: Transaction apply changes
  D-->>S: Commit
  S-->>C: { ok: true, newTimestamp }
  C->>S: POST /sync/pull (locationId, lastPulledAt=newTimestamp)
  S->>D: Query deltas by updatedAt/deletedAt
  D-->>S: changes
  S-->>C: { changes, timestamp }
```

- `GET /tickets` uses offset pagination (`limit`, `offset`) and returns `{ items, page }`.
- `GET /tickets/:id/activity` returns ticket timeline records ordered by `createdAt DESC`.
- `POST /sync/pull` uses cursor pagination with per-entity offsets and a fixed `snapshotAt` timestamp to keep multipage pulls consistent.
- `POST /sync/push` preloads existing records by batched `findMany(where: { id: { in: [...] } })` per entity to avoid N+1 lookups inside mutation loops.

## 8. Security Architecture
- Access:
  - short-lived JWT access token in Authorization header.
  - refresh token in HttpOnly cookie (`/auth` path).
  - invite onboarding uses signed short-lived invite token (`/auth/invite/complete`) and atomically claims membership (`invited` -> `active`) in the same transaction as initial password set.
  - refresh cookie `sameSite` is controlled by `COOKIE_SAME_SITE` (`lax` default; `none` for cross-site web/api domains).
  - refresh cookie `secure` flag is controlled by `COOKIE_SECURE` (fallback: `NODE_ENV === production`); `SameSite=None` forces `secure=true`.
  - auth brute-force mitigation is enforced via throttling on `/auth/login` and `/auth/refresh`.
- Authorization:
  - location scoping for tenant separation.
  - privilege-based endpoint checks.
  - admin override for internal operators.

## 9. Deployment Notes
- Local dev:
  - Dedicated Docker images/containers:
    - `docker/Dockerfile.web` -> image `jtrack-web`, container `jtrack-web`
    - `docker/Dockerfile.api` -> image `jtrack-api`, container `jtrack-api`
    - `postgres:16` -> `jtrack-postgres`
  - API/Web Dockerfiles use multi-stage builds (`deps` -> `builder` -> `runner`) to reduce runtime image size.
  - Docker build context filtering uses repository `.dockerignore`; docker-local mirror rules are stored in `docker/.dockerignore`.
  - Startup via `docker/docker-compose.yml` (`docker-compose up -d`).
  - Default local container endpoints: web `http://localhost:3010`, API `http://localhost:3011`, Postgres `localhost:5433`.
  - API container startup runs `node apps/api/node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma` before app start.
  - If `SEED_DEMO_DATA=true`, startup also runs `node apps/api/dist/prisma/seed.js` (idempotent upserts for demo users/location).
  - DB service has network alias `jtrack`; API uses `postgresql://...@jtrack:5432/...`.
  - Legacy Prisma migration `20260223082027_init` is a no-op placeholder to keep migration chain valid in clean environments.
  - API TypeScript output is fixed to `apps/api/dist` (`apps/api/tsconfig.json` with explicit `outDir`).
  - API runtime entrypoint is `node dist/src/main.js` (`apps/api/package.json` start script).
- Cloud deploy:
  - Backend (Render): `/Users/vlad/Projects/JTrack/render.yaml`
    - Deploys `jtrack-api` from `docker/Dockerfile.api`.
    - Uses Render Postgres `jtrack-db`.
    - Uses Dockerfile `CMD` for startup (apply Prisma migrations, optional demo seed, then start API).
    - API port resolution supports `API_PORT` and falls back to Render `PORT`.
  - Frontend (Vercel): `/Users/vlad/Projects/JTrack/vercel.json`
    - Builds static Nuxt output via `pnpm --filter @jtrack/web build:mobile`.
    - Publishes `apps/web/.output/public`.
    - Root route `/` is explicitly prerendered in Nuxt route rules to guarantee static entrypoint generation.
    - Critical auth/navigation entry routes are explicitly prerendered (`/`, `/login`, `/dashboard`, `/locations`) to prevent 404s when SPA rewrites are unavailable or bypassed.
    - App routes (`/login`, `/dashboard`, etc.) are served via SPA rewrite fallback and are not prerendered to avoid route payload fetches (`/_payload.json`) on client navigation.
    - Nuxt payload extraction is disabled in web config to prevent runtime `/_payload.json` requests in static SPA mode.
    - SPA fallback rewrite to `/index.html`.
- Production target:
  - stateless API instances behind load balancer,
  - managed PostgreSQL,
  - object storage provider replacing local uploads,
  - optional CDN for static/web assets.

## 10. Architectural Risks and Mitigations
- Risk: sync conflicts under intermittent connectivity.
  - Mitigation: deterministic server-wins policy + pull-after-push.
- Risk: tenant leakage by missing location context.
  - Mitigation: mandatory `x-location-id` guard and role checks.
- Risk: stale refresh tokens.
  - Mitigation: refresh token hashing + rotation on refresh/login.

## 11. Testing Architecture
- Test runner:
  - `Vitest` is configured per package (`apps/api`, `apps/web`, `packages/shared`).
  - Monorepo test entrypoint is `pnpm test` (`turbo run test`).
- API unit coverage:
  - `AuthService` token/cookie/auth failure paths.
  - `SyncService` pull/push conflict handling (server-wins).
  - RBAC guards (`LocationGuard`, `PrivilegesGuard`).
- Web unit coverage:
  - Pinia `auth` store flows (login/refresh/bootstrap/me).
  - Pinia `sync` store flows (push+pull orchestration, incoming changes application, error handling).
- Shared package coverage:
  - Sync schema contracts and RBAC role-privilege matrix invariants.
