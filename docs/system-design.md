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
- Core entities: tickets, ticket activities, comments, attachments, payment records.
- Ticket status updates are role-constrained and validated by shared transition policy through dedicated `/tickets/{id}/status` endpoint.
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
- Client route middleware runs auth/location bootstrap in background and then re-validates the current route, allowing immediate shell/skeleton render during refresh-token roundtrip.
- Client auth store deduplicates concurrent bootstrap/refresh calls; persisted user snapshot is cleared before revalidation in online mode, while offline mode allows snapshot-backed route access to preserve cached shell availability.
- After successful online login, client stores a salted offline login verifier (`jtrack.offlineLogin`) derived via WebCrypto PBKDF2 from normalized email + password; when browser is offline, login can be completed against this local verifier.
- Auth fallback path classifies transport-level fetch failures (without HTTP status) as offline-like failures, so hard-reload cases where browser still reports `navigator.onLine=true` can still recover via local offline credentials.
- PWA dev offline mode installs a dedicated local service worker by default in development (`NUXT_PUBLIC_ENABLE_DEV_OFFLINE` can explicitly disable with `false`); the worker caches shell routes/assets and is preferred over full SW/cache reset when testing offline flows.
- Dev offline bootstrap forces one-time service-worker controller takeover and warms shell cache to improve offline hard-refresh reliability.
- In dev offline mode, route middleware also skips auth/location redirect enforcement while offline so cached routes are not replaced by uncached login redirects.
- Location memberships snapshot is persisted client-side and restored before online reload, allowing dashboard/location context rendering when offline.
- Dispatch page guard restores local auth/location snapshots before privilege check so owners do not lose `dispatch.manage` access during offline reload races.

## 5. Data Model Strategy
- Relational core with explicit foreign keys.
- Tickets include a location-scoped sequential `ticketNumber` used as the human-readable identifier in UI.
- Tickets include persisted checklist data on `Ticket.checklist` (`[{ id, label, checked }]`).
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
- Current pull entities: `tickets`, `ticketActivities`, `ticketComments`, `ticketAttachments`, `paymentRecords`.
- Returns stable `timestamp` (equal to `snapshotAt`) for next client checkpoint.

### 6.2 Push (`POST /sync/push`)
- Input: `{ locationId, lastPulledAt, changes, clientId }`.
- Server applies each entity batch inside one DB transaction.
- Existing rows for each entity batch are preloaded with `findMany(id in [...])` to avoid N+1 per-record lookups.
- Client-provided `ticketActivities` mutations are ignored on push; activity records are server-authored only.
- Client keeps pull baseline at prior `lastPulledAt` to avoid skipping concurrent remote writes and suppresses push-echo payloads locally by comparing pushed IDs with pulled records updated at or before push `newTimestamp`.
  - `updatedAt === newTimestamp` is treated as same-cycle echo and filtered out.
  - Delete echo suppression is ID-based (pull deleted payload contains IDs only, without per-record timestamps).
- Conflict policy: server-wins (last-write-wins by server timeline).
  - If existing row was updated after client `lastPulledAt`, incoming mutation is skipped.
- On success returns `{ ok: true, newTimestamp }`.

### 6.3 Client Storage Implementation Note
- RxDB v16 document updates must use `incrementalPatch`/`incrementalModify`.
- `atomicPatch` is not supported in this version and causes runtime method errors.
- Offline attachment files are staged in local `pendingAttachmentUploads` collection and uploaded during the next online sync cycle before outbox push.
  - Staged file payload is stored once (in `pendingAttachmentUploads`), while `ticketAttachments` keeps a lightweight pending placeholder.
  - Offline staging is bounded by max file size (25MB) to reduce IndexedDB quota pressure.
  - Pending uploads are flushed with per-item retry semantics: one failed file does not block subsequent files in the same sync run.
- Ticket detail attachment card renders image thumbnails and file metadata rows separately, with soft-delete actions enqueued through outbox.
- Drag-and-drop upload card accepts multiple files per action and displays per-file progress/status rows before final sync flush.
- Ticket detail activity feed merges `ticketActivities` with non-deleted `ticketComments` and sorts by `createdAt DESC`.
- Comment timeline items expose author metadata and support owner-only edit/delete actions via outbox (`ticketComments` update/delete ops).
- Ticket checklist state is updated through regular ticket outbox updates (no separate checklist entity/collection).
- Tickets page exposes unified tabs (`all|board|calendar|map`) and persists active view through URL query (`view`).
- Tickets `all` panel handles RxDB subscription lifecycle with dedicated loading skeleton, empty states, and retryable error state.
- Tickets route also uses a page-level skeleton during auth/location bootstrap and first local list hydration.
- Ticket detail mobile mode exposes dedicated action row (`Start Job`, `Navigate`, `Call Customer`) and accordion-style sections.
- On RxDB schema mismatch during startup (`DB6`), client avoids destructive IndexedDB reset and starts on recovery DB name to preserve previous local data for manual recovery.
- Primary client RxDB name is schema-epoch versioned (`jtrack_crm_v2`) to avoid legacy schema collisions.
- If recovery DB still hits `DB6` (e.g. blocked IndexedDB handles), startup falls back to an emergency unique suffix to avoid app-init crash, followed by sync rehydration.
- Sync plugin initialization is intentionally non-blocking so layout shell can render before bootstrap/sync network calls complete.
- Dashboard page uses a skeleton loading view while auth bootstrap and location context are still resolving.
- Offline login can restore user identity without network, but location-dependent dashboard widgets still require previously cached location memberships.
- On active `locationId` switch, non-active location documents are pruned from RxDB collections (`tickets`, `ticketActivities`, `ticketComments`, `ticketAttachments`, `paymentRecords`, `outbox`, `pendingAttachmentUploads`) and stale sync checkpoints are removed.
- Logout workflow clears sync metadata and recreates a fresh local RxDB instance for safe same-tab re-login.
- Dispatch map view is implemented with Leaflet + OpenStreetMap tiles.
- Current map positions are deterministic pseudo-coordinates derived from `hash(ticketId + locationId)` within a fixed bounding box, pending backend geolocation fields.

## 7. Consistency and Conflict Rules
- Canonical state is always server DB.
- Client convergence guarantee:
  - push may skip stale updates,
  - next pull returns authoritative state.
- Deletions are modeled as tombstones (`deletedAt`), not hard delete.

## 8. Error Handling
- Auth failures: `401 Unauthorized`.
- Auth rate-limit exceeded: `429 Too Many Requests` with message body `Too Many Requests`.
- Missing location context: `400 Bad Request` (`x-location-id` absent).
- Permission and membership violations: `403 Forbidden`.
- Missing domain object: `404 Not Found`.
- Location delete with dependent business records: `409 Conflict`.
- Health readiness check when DB is unavailable: `503 Service Unavailable`.
- Invalid or already-used invite token: `401 Unauthorized`.
- Validation is schema-based (Zod) and fails fast at controller boundary via parameter-level `ZodValidationPipe` bindings; pipe also normalizes JSON-string payloads (including double-serialized payloads) before schema validation to tolerate legacy clients.
- API response date serialization is centralized in `apps/api/src/common/date-serializer.ts` to keep all date fields consistently ISO formatted.

## 9. Non-Functional Requirements
- Security:
  - bcrypt hash for passwords and stored refresh tokens.
  - invited users do not rely on hardcoded password; onboarding is completed through signed invite token and one-time membership activation that is atomically claimed in the same transaction as password update (prevents parallel token reuse race).
  - refresh token cookie is `httpOnly`, path-scoped to `/auth`.
  - refresh token cookie `sameSite` attribute is controlled by `COOKIE_SAME_SITE` (default `lax`; use `none` for cross-site frontend/backend).
  - refresh token cookie `secure` attribute is controlled by `COOKIE_SECURE` (fallback to `NODE_ENV === production`); `SameSite=None` forces `secure=true`.
  - auth endpoints `/auth/login` and `/auth/refresh` are protected by request throttling by default; dev/test can opt out with `NODE_ENV` or `AUTH_THROTTLE_DISABLED=true`.
- Performance:
  - location/update-time indexes for sync and listing patterns.
  - bounded payloads via `GET /tickets` offset pagination and `POST /sync/pull` cursor pagination.
  - push-side mutation checks use batched `findMany` preloads instead of per-record `findUnique`.
- Operability:
  - Dockerized local stack with separate containers for web/api/postgres.
  - Default local container endpoints: web `http://localhost:3010`, API `http://localhost:3011`, Postgres `localhost:5433`.
  - Local `docker/docker-compose.yml` runs `web` in `nuxt dev` mode with bind-mounted sources, so HMR works by default.
  - Web container reads root `../.env` via `env_file`, including `NUXT_PUBLIC_ENABLE_DEV_OFFLINE` for offline testing toggles.
  - Local `docker/docker-compose.yml` sets API `NODE_ENV=development`, so throttling is skipped for local iterative auth testing.
  - API/Web images are built via multi-stage Dockerfiles to keep runtime layers lean.
  - Docker build context excludes heavy local artifacts via `.dockerignore`.
  - Single-command monorepo dev workflow via Turbo.
  - Local DB migration workflow uses `pnpm db:migrate` without hardcoded migration names (optional explicit name via `pnpm db:migrate -- --name <migration_name>`).
  - CI quality gate runs `pnpm test` on every `pull_request` and on `push` to `main`/`develop` via GitHub Actions (`.github/workflows/tests.yml`).
  - Repository hygiene: local IDE metadata (`.idea`) and generated shared build artifacts (`packages/shared/dist`) are excluded from VCS via `.gitignore`.

## 10. Tradeoffs
- `isAdmin` bypass simplifies internal operations but centralizes trust.
- Soft-delete increases query complexity but is required for sync tombstones.
- Server-wins conflict policy is simple and predictable, but may overwrite unsynced local intent.

## 11. Test Strategy and Quality Gates
- Test infrastructure:
  - `Vitest` is configured for `apps/api`, `apps/web`, and `packages/shared`.
  - Workspace command `pnpm test` runs package-level tests through Turbo.
  - Turbo `test` task depends on `^build`, so shared workspace exports are built before dependent package tests in clean CI environments.
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
