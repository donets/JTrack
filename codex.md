You are Codex acting as a senior fullstack engineer. Initialize a production-ready monorepo for a B2B Field Service CRM with:

High-level
- Web Portal (Nuxt 4 + Vue 3 + Pinia + Tailwind + TypeScript) for managing jobs, dispatch, scheduling, users, locations
- Mobile App initially as Capacitor wrapper on top of the Web App (same codebase), with offline-first + full data sync
- Backend API (Node.js + NestJS + Postgres) as the single source of truth

Important: React Native is NOT decided. Do NOT build a separate RN app now.
Instead:
- Make the Nuxt app PWA-friendly and mobile-friendly
- Add a Capacitor shell app that bundles the Nuxt build
- Architect sync/offline in a way that can be reused later if we add React Native + WatermelonDB

Hard requirements
- Offline-first data access on mobile (Capacitor) AND web, with full bi-directional sync with backend
- Sync endpoints compatible with a “local DB + pull/push changes” model (Watermelon-style), even if we start with RxDB
- Roles predefined: Owner, Manager, Technician
- Privileges model: roles map to a set of privileges. Future roles can be added by defining a role and attaching privileges
- Internal admin flag: User.isAdmin (for our team only) to onboard clients etc
- Data:
    - Locations
    - Users many-to-many Locations, per-location role assignment
    - Tickets (with comments, attachments, billing/payments, status) etc

Tech choices
- Package manager: pnpm
- Monorepo tool: turbo (implement fully)
- Backend ORM/migrations: Prisma + Postgres
- Validation/DTOs: Zod in packages/shared (shared across web + api)
- Auth: email+password + JWT access/refresh
    - Web: refresh token in httpOnly cookie
    - Mobile/Capacitor: also rely on cookies (preferred) OR fallback to storing refresh token securely (implement cookie-first)
- Attachments: S3-compatible provider interface + local dev provider
- No semicolons in TS/JS code
- Strict TypeScript, clean module boundaries

Offline + Sync approach (Capacitor + Web)
- Implement offline local database in the Nuxt app using RxDB (IndexedDB/Dexie storage) for now
    - Works in browser and inside Capacitor WebView
    - Keep the sync protocol generic so RN + WatermelonDB can later adopt the same endpoints
- Implement a local “outbox” of pending mutations when offline
- Implement pull/push sync service:
    - Pull: get changes since lastPulledAt (timestamp)
    - Push: send local changes in batches, apply on server transactionally
    - Provide a simple conflict strategy (pick one and implement):
      Option A: server-wins (LWW), client re-pulls
      Option B: reject conflicts with 409 + details
      Choose ONE, implement end-to-end, document it in README

Deliverables (create files, code, configs)

1) Monorepo structure
- apps/
    - web/ (Nuxt 4)
    - api/ (NestJS)
    - mobile/ (Capacitor shell that wraps web build)
- packages/
    - shared/ (types + zod schemas + privilege definitions + sync payload types)
    - eslint-config/
    - tsconfig/
- docker/ (postgres)
- turbo.json, pnpm-workspace.yaml, root package.json scripts

2) Backend (apps/api)
   NestJS modules:
- auth (login, refresh, logout, me)
- users (CRUD + invite onboarding basic)
- locations (CRUD)
- tickets (CRUD + status transitions)
- comments (ticket comments)
- attachments (presigned upload + metadata)
- payments (stub, store payment records, later integrate Stripe)
- rbac (roles/privileges, guards, decorators)
- sync (pull/push endpoints)

Prisma schema + migrations + seed script

3) Data model (Prisma)
   Implement these tables with constraints + indexes:

User
- id uuid, email unique, passwordHash, name
- isAdmin boolean default false
- createdAt, updatedAt

Location
- id uuid, name, timezone, address optional
- createdAt, updatedAt

UserLocation (join)
- userId, locationId
- role enum Owner | Manager | Technician
- status invited | active | suspended
- createdAt
- composite PK (userId, locationId)
- indexes on (locationId), (userId)

Role/Privilege model
- Privilege key string (e.g. "tickets.read", "tickets.write", "dispatch.manage", "users.manage")
- Role key string (Owner, Manager, Technician)
- RolePrivilege join (roleKey, privilegeKey)
  Decide DB-driven vs code-driven:
- Use code-driven constants in packages/shared
- Seed ensures DB tables mirror code (idempotent)

Ticket
- id uuid
- locationId
- createdByUserId
- assignedToUserId nullable
- title, description nullable
- status enum New | Scheduled | InProgress | Done | Invoiced | Paid | Canceled
- scheduledStartAt nullable, scheduledEndAt nullable
- priority optional
- totalAmountCents nullable, currency default "EUR"
- createdAt, updatedAt
- deletedAt nullable (soft delete required for sync)
  Indexes:
- (locationId, updatedAt)
- (locationId, status)
- (locationId, assignedToUserId)

TicketComment
- id, ticketId, locationId, authorUserId
- body
- createdAt, updatedAt, deletedAt

TicketAttachment
- id, ticketId, locationId, uploadedByUserId
- kind Photo | File
- storageKey/url, mimeType, size, width/height optional
- createdAt, updatedAt, deletedAt

PaymentRecord (stub)
- id, ticketId, locationId
- provider "manual" | "stripe"
- amountCents, currency
- status Pending | Succeeded | Failed | Refunded
- createdAt, updatedAt

Multi-tenancy rule
- Every business entity is scoped by locationId
- API requires locationId context via header "x-location-id"
- User must be member of locationId via UserLocation, unless user.isAdmin is true (internal staff)

4) Auth + Guards
- AuthGuard validates access token
- LocationGuard reads "x-location-id" and checks membership or isAdmin
- RBAC:
    - @RequirePrivileges([...]) decorator
    - Guard resolves user’s role for the active location and checks privileges
    - Define initial privilege sets:
      Owner: all
      Manager: manage tickets + dispatch + technicians, cannot change billing
      Technician: read assigned tickets, update status, add comments/attachments

5) Sync API (generic Watermelon-style protocol)
   Endpoints:
- POST /sync/pull
  body: { locationId, lastPulledAt: number | null }
  response: {
  changes: {
  tickets: { created: [], updated: [], deleted: [] },
  ticketComments: ...
  ticketAttachments: ...
  paymentRecords: ...
  },
  timestamp: number
  }

- POST /sync/push
  body: {
  locationId,
  lastPulledAt: number | null,
  changes: same shape,
  clientId: string
  }
  response: { ok: true, newTimestamp: number } OR conflicts (if you choose 409 strategy)

Server-side sync rules
- Use updatedAt and deletedAt for change tracking
- Pull returns rows where updatedAt > lastPulledAt OR deletedAt > lastPulledAt
- Push applies creates/updates/deletes in transactions
- Choose and implement conflict strategy consistently
- Document payloads + conflict behavior in README

6) Web app (apps/web) — also serves as Mobile UI
   Nuxt 4 + Vue 3 + Pinia + Tailwind + TypeScript
   Pages:
- /login
- /locations (select active location)
- /tickets (table with filters)
- /tickets/:id (details + comments + attachments)
- /dispatch (basic board stub)

Pinia stores:
- useAuthStore (session + user)
- useLocationStore (active location + memberships)
- useSyncStore (sync state, lastSyncedAt, errors)

Route middleware:
- require auth
- require active location

API client composable:
- adds "x-location-id"
- typed using packages/shared DTOs

Offline DB in Nuxt (RxDB)
- Implement RxDB plugin client-only
- Collections mirror server entities (tickets, comments, attachments, payments)
- Local writes go to RxDB and enqueue an outbox mutation record
- Sync service:
    - runs on app start
    - runs on interval (e.g. every 60s)
    - manual “Sync now”
    - handles offline/online transitions
- Make the UI read from RxDB (reactive queries) and not from Pinia as primary storage
    - Pinia keeps only UI state, not the entire dataset

Attachments on mobile/web
- Provide unified adapter:
    - Web: file input
    - Mobile (Capacitor): use Capacitor Camera / Filesystem plugins (implement minimal integration)
- Upload path: request presigned URL -> upload -> create attachment metadata record -> sync

7) Mobile shell (apps/mobile) — Capacitor wrapper
- Capacitor project that points to apps/web build output as webDir
- Scripts:
    - build:web:mobile (Nuxt build suitable for Capacitor)
    - cap:sync
    - cap:open:ios / cap:open:android
- Minimal config: appId, appName, server config for dev if needed
- Ensure cookies/auth work inside WebView
- Keep this thin: no business logic here

8) Shared package (packages/shared)
- Zod schemas + inferred TS types:
    - User, Location, UserLocation, Ticket, TicketComment, TicketAttachment, PaymentRecord
    - DTOs for create/update and sync payloads
- Role/Privilege constants:
    - RoleKey enum
    - PrivilegeKey string union
    - rolePrivileges map
- Keep framework-agnostic

9) Tooling
- Root scripts: dev, build, lint, typecheck, db:migrate, db:seed
- Docker compose for Postgres + env example
- ESLint shared config, strict TS, no semicolons
- README with:
    - how to run (docker, migrations, start apps)
    - tenancy (x-location-id)
    - offline/sync design (outbox, pull/push, conflict strategy)
    - capacitor commands

Seed data
- internal admin user (isAdmin true)
- one demo location
- one owner membership
- a couple of tickets

Now create the full repository with all files and code accordingly. Ensure everything runs after install with minimal manual steps.
