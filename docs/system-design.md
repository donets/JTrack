# JTrack System Design

## 1. Goals
- Support field-service CRM workflows for distributed teams.
- Provide location-scoped multi-tenancy with strict authorization.
- Work reliably in low-connectivity environments via offline-first sync.
- Keep operational setup simple for local development and staging.

## 2. Functional Scope
- Authentication: email/password + JWT access token + refresh token.
- Health check: public `GET /health` for readiness/liveness probes.
- Invite onboarding: signed invite token + first-time password setup endpoint.
- Multi-location tenancy: each domain record belongs to a `locationId`.
- RBAC: role/privilege model with guards on each protected endpoint.
- Core entities: tickets, comments, attachments, payment records.
- Offline sync: pull/push protocol over deterministic change-sets.

## 3. Runtime Components
- `apps/web`: Nuxt 4 SPA/PWA, UI + client sync orchestration.
- `apps/mobile`: Capacitor shell around web output.
- `apps/api`: NestJS service with auth, RBAC, domain modules, sync module.
- PostgreSQL: canonical persistent store.
- Local object store (dev): filesystem-backed attachment storage under `/uploads`.

## 4. Request Security Model
- Access token must be sent in `Authorization: Bearer <jwt>`.
- For location-scoped endpoints, `x-location-id` header is mandatory.
- `LocationGuard` validates location membership for non-admin users.
- `PrivilegesGuard` validates endpoint privileges resolved from role.
- Internal admins (`isAdmin = true`) bypass membership and privilege constraints, and request context receives synthetic `locationRole=Owner` for downstream consistency.

## 5. Data Model Strategy
- Relational core with explicit foreign keys.
- Soft-delete for user-generated mutable records:
  - `Ticket.deletedAt`
  - `TicketComment.deletedAt`
  - `TicketAttachment.deletedAt`
- User removal is hard-delete, but in-transaction it first clears `refreshTokenHash` for session invalidation, then reassigns historical references (`Ticket.createdByUserId`, `Ticket.assignedToUserId`, `TicketComment.authorUserId`, `TicketAttachment.uploadedByUserId`) to a reserved non-admin system account before delete.
- Strong indexing by location and update time to optimize pull windows.
- Role privileges persisted in DB but defined in code and seeded.

## 6. Offline Sync Protocol
### 6.1 Pull (`POST /sync/pull`)
- Input: `{ locationId, lastPulledAt, limit?, cursor? }`.
- Server returns records where:
  - `updatedAt > lastPulledAt`, or
  - `deletedAt > lastPulledAt` (for soft-deletable entities).
- Pull responses are paginated:
  - `limit` bounds each entity page.
  - `nextCursor` carries per-entity offsets and fixed `snapshotAt`.
  - `hasMore=true` means client must request the next page with `cursor`.
- Output grouped by entity and operation:
  - `created[]`
  - `updated[]`
  - `deleted[]` (IDs only)
- Returns stable `timestamp` (equal to `snapshotAt`) for next client checkpoint.

### 6.2 Push (`POST /sync/push`)
- Input: `{ locationId, lastPulledAt, changes, clientId }`.
- Server applies each entity batch inside one DB transaction.
- Existing rows for each entity batch are preloaded with `findMany(id in [...])` to avoid N+1 per-record lookups.
- Client keeps pull baseline at prior `lastPulledAt` to avoid skipping concurrent remote writes and suppresses push-echo payloads locally by comparing pushed IDs with pulled records updated at or before push `newTimestamp`.
  - `updatedAt === newTimestamp` is treated as same-cycle echo and filtered out.
  - Delete echo suppression is ID-based (pull deleted payload contains IDs only, without per-record timestamps).
- Conflict policy: server-wins (last-write-wins by server timeline).
  - If existing row was updated after client `lastPulledAt`, incoming mutation is skipped.
- On success returns `{ ok: true, newTimestamp }`.

### 6.3 Client Storage Implementation Note
- RxDB v16 document updates must use `incrementalPatch`/`incrementalModify`.
- `atomicPatch` is not supported in this version and causes runtime method errors.
- Logout workflow clears sync metadata and recreates a fresh local RxDB instance for safe same-tab re-login.

## 7. Consistency and Conflict Rules
- Canonical state is always server DB.
- Client convergence guarantee:
  - push may skip stale updates,
  - next pull returns authoritative state.
- Deletions are modeled as tombstones (`deletedAt`), not hard delete.

## 8. Error Handling
- Auth failures: `401 Unauthorized`.
- Auth rate-limit exceeded: `429 Too Many Requests`.
- Missing location context: `400 Bad Request` (`x-location-id` absent).
- Permission and membership violations: `403 Forbidden`.
- Missing domain object: `404 Not Found`.
- Location delete with dependent business records: `409 Conflict`.
- Health readiness check when DB is unavailable: `503 Service Unavailable`.
- Invalid or already-used invite token: `401 Unauthorized`.
- Validation is schema-based (Zod) and fails fast at controller boundary via `ZodValidationPipe`; service layer consumes already-validated typed inputs.
- API response date serialization is centralized in `apps/api/src/common/date-serializer.ts` to keep all date fields consistently ISO formatted.

## 9. Non-Functional Requirements
- Security:
  - bcrypt hash for passwords and stored refresh tokens.
  - invited users do not rely on hardcoded password; onboarding is completed through signed invite token and one-time membership activation that is atomically claimed in the same transaction as password update (prevents parallel token reuse race).
  - refresh token cookie is `httpOnly`, `sameSite=lax`, path-scoped to `/auth`.
  - refresh token cookie `secure` attribute is controlled by `COOKIE_SECURE` (fallback to `NODE_ENV === production`).
  - auth endpoints `/auth/login` and `/auth/refresh` are protected by request throttling.
- Performance:
  - location/update-time indexes for sync and listing patterns.
  - bounded payloads via `GET /tickets` offset pagination and `POST /sync/pull` cursor pagination.
  - push-side mutation checks use batched `findMany` preloads instead of per-record `findUnique`.
- Operability:
  - Dockerized local stack with separate containers for web/api/postgres.
  - API/Web images are built via multi-stage Dockerfiles to keep runtime layers lean.
  - Docker build context excludes heavy local artifacts via `.dockerignore`.
  - Single-command monorepo dev workflow via Turbo.
  - Local DB migration workflow uses `pnpm db:migrate` without hardcoded migration names (optional explicit name via `pnpm db:migrate -- --name <migration_name>`).
  - CI quality gate runs `pnpm test` on every `pull_request` and on `push` to `main`/`develop` via GitHub Actions (`.github/workflows/tests.yml`).
  - Repository hygiene: local IDE metadata (`.idea`) is excluded from VCS via `.gitignore`.

## 10. Tradeoffs
- `isAdmin` bypass simplifies internal operations but centralizes trust.
- Soft-delete increases query complexity but is required for sync tombstones.
- Server-wins conflict policy is simple and predictable, but may overwrite unsynced local intent.

## 11. Test Strategy and Quality Gates
- Test infrastructure:
  - `Vitest` is configured for `apps/api`, `apps/web`, and `packages/shared`.
  - Workspace command `pnpm test` runs package-level tests through Turbo.
  - Web tests run `nuxt prepare` before `vitest` so CI does not depend on pre-existing `.nuxt/tsconfig.json`.
- Critical path coverage:
  - API: auth service, sync service, location/privilege guards.
  - Web: Pinia auth/sync stores.
  - Shared: sync contract schema validation and RBAC privilege mapping.
- Verification commands used in delivery flow:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
- API type-safety note:
  - Service-layer mappings and transaction callbacks are explicitly typed to keep `noImplicitAny` checks stable even when Prisma enum exports are unavailable during static analysis.
