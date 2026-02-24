# AGENTS.md

This file defines the working contract for any coding agent in this repository.

## 1) First Rule: Use Project Docs

Before making changes, always reference documentation in `/Users/vlad/Projects/JTrack/docs`.

Primary sources of truth:
- `/Users/vlad/Projects/JTrack/docs/architecture.md`
- `/Users/vlad/Projects/JTrack/docs/system-design.md`
- `/Users/vlad/Projects/JTrack/docs/api-spec.yml`
- `/Users/vlad/Projects/JTrack/docs/data-models.ts`
- `/Users/vlad/Projects/JTrack/docs/db-schema.sql`

If implementation and docs diverge, fix implementation and update docs in the same task.

After every code change, always:
- update relevant files in `/Users/vlad/Projects/JTrack/docs`
- add/update a task note under `/Users/vlad/Projects/JTrack/docs/changelog` (prefer one file per issue, e.g. `JTR-123.md`)

Update `/Users/vlad/Projects/JTrack/AGENTS.md` only when agent rules/process change (not for routine task delivery notes).

## 2) Project Context

Monorepo:
- `apps/api` — NestJS + Prisma + PostgreSQL
- `apps/web` — Nuxt 4 + RxDB
- `apps/mobile` — Capacitor shell
- `packages/shared` — Zod schemas, RBAC constants, sync contracts

Default local ports:
- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Postgres: `localhost:5432`

## 3) Local Setup and Run

Use these commands from repo root:

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm install
pnpm --filter @jtrack/api prisma:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Containerized runtime (separate web/api/postgres containers):

```bash
docker-compose -f docker/docker-compose.yml up -d --build
docker-compose -f docker/docker-compose.yml logs -f
```

Useful checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## 4) Domain and Security Constraints (Must Preserve)

- Multi-tenancy is location-scoped for business data.
- Protected location endpoints require `x-location-id`.
- Auth uses `Authorization: Bearer <access-token>`.
- RBAC is privilege-based and enforced by guards.
- `isAdmin` users bypass membership/privilege checks.
- Tickets/comments/attachments are soft-deleted via `deletedAt`.
- Sync conflict strategy is server-wins.

Do not implement changes that break these constraints.

## 5) API and Data Change Rules

When changing backend behavior, keep all relevant artifacts aligned:

- Controller/service behavior in `apps/api`
- Zod contracts in `packages/shared`
- OpenAPI in `/docs/api-spec.yml`
- Types in `/docs/data-models.ts`
- SQL shape in `/docs/db-schema.sql` (if schema changed)

If DB schema changes:
- update Prisma schema
- create/apply migration
- update docs SQL model

## 6) Coding Expectations

- Prefer small, focused diffs.
- Reuse existing patterns in module/service/controller layers.
- Validate input with shared Zod schemas.
- Keep API date fields serialized as ISO strings.
- Avoid introducing new libraries unless necessary.

## 7) Verification Before Handoff

At minimum, run:

```bash
pnpm lint
pnpm typecheck
```

For feature changes, also run targeted manual/API checks relevant to the task.
For test-focused tasks, also run `pnpm test`.

## 8) Handoff Format

When done, report:
- what changed
- files touched
- verification commands run
- known limitations or follow-ups

Always include references to updated docs under `/Users/vlad/Projects/JTrack/docs`.
Include the updated changelog file path from `/Users/vlad/Projects/JTrack/docs/changelog`.

## 9) Change Log Policy

- Canonical task changelog lives in `/Users/vlad/Projects/JTrack/docs/changelog`.
- Historical entries that were previously kept in this file are archived in:
  - `/Users/vlad/Projects/JTrack/docs/changelog/archive-2026-02.md`
- Do not append routine task entries to `AGENTS.md`; this avoids recurring merge conflicts across parallel feature branches.
