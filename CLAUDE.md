# CLAUDE.md

## Project Overview

JTrack is a field-service CRM platform with offline-first sync, location-scoped multi-tenancy, and RBAC. Monorepo managed by pnpm + Turborepo.

## Repository Structure

```
apps/api        — NestJS + Prisma + PostgreSQL (port 3001)
apps/web        — Nuxt 4 + Pinia + RxDB (port 3000)
apps/mobile     — Capacitor shell wrapping web output
packages/shared — Zod schemas, RBAC constants, sync contracts
packages/eslint-config
packages/tsconfig
docker/         — Dockerfiles and docker-compose.yml
docs/           — Architecture, system design, API spec, data models, DB schema
```

## Tech Stack

- **Backend**: NestJS, Prisma ORM, PostgreSQL 16, JWT auth (access + refresh tokens)
- **Frontend**: Nuxt 4 (Vue 3), RxDB v16 (IndexedDB/Dexie), Pinia
- **Mobile**: Capacitor
- **Shared**: Zod schemas for validation, TypeScript throughout
- **Tooling**: pnpm 9, Turborepo, Docker Compose

## Quick Start

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm install
pnpm --filter @jtrack/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Containerized (separate web/api/postgres containers):
```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start all apps in parallel (Turbo) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript checks across monorepo |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Build shared + seed database |
| `pnpm --filter @jtrack/api prisma:generate` | Regenerate Prisma client |

## Documentation (Source of Truth)

Always consult before making changes:

- `docs/architecture.md` — Runtime/container view, module boundaries, deployment
- `docs/system-design.md` — Functional scope, security model, sync protocol
- `docs/api-spec.yml` — OpenAPI 3.0 spec (all endpoints)
- `docs/data-models.ts` — TypeScript domain contracts
- `docs/db-schema.sql` — PostgreSQL DDL with indexes

**If implementation diverges from docs, fix implementation and update docs in the same task.**

## Architecture Constraints (Must Preserve)

1. **Multi-tenancy**: location-scoped; business data is partitioned by `locationId`
2. **Auth**: `Authorization: Bearer <access-token>`; refresh token in HttpOnly cookie
3. **Location guard**: protected endpoints require `x-location-id` header
4. **RBAC**: privilege-based enforcement via guards; `isAdmin` bypasses checks
5. **Soft-delete**: Ticket, TicketComment, TicketAttachment use `deletedAt` (tombstones for sync)
6. **Sync**: server-wins conflict strategy; pull-after-push convergence
7. **RxDB v16**: use `incrementalPatch`/`incrementalModify` (NOT `atomicPatch`)

## API Modules (apps/api/src)

`auth` · `rbac` · `locations` · `users` · `tickets` · `comments` · `attachments` · `payments` · `sync` · `prisma`

Guards: `JwtAuthGuard` → `LocationGuard` → `PrivilegesGuard`

## Coding Rules

- **Never** add `Co-Authored-By` lines to commit messages
- Small, focused diffs; reuse existing module/service/controller patterns
- Validate input with shared Zod schemas (`packages/shared`)
- Date fields serialized as ISO strings
- Keep API, Zod contracts, OpenAPI spec, data-models.ts, and db-schema.sql aligned
- DB schema changes → update Prisma schema, create migration, update docs SQL
- Avoid introducing new libraries unless necessary

## Verification

Run before every handoff:
```bash
pnpm lint
pnpm typecheck
```

## Deployment

- **Local**: Docker Compose with `jtrack-web`, `jtrack-api`, `jtrack-postgres` containers
- **Cloud backend**: Render (`render.yaml`) — Dockerfile.api + managed Postgres (`jtrack-db`)
- **Cloud frontend**: Vercel (`vercel.json`) — static Nuxt build, SPA fallback

## Handoff Format

Report: what changed, files touched, verification commands run, known limitations. Include references to updated docs.