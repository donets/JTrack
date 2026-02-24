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
- update `/Users/vlad/Projects/JTrack/AGENTS.md` (change log/rules consistency)

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

## 9) Change Log

- 2026-02-24: Fixed CI web test failure for missing `.nuxt/tsconfig.json`: `apps/web` test script now runs `nuxt prepare` before `vitest`.
- 2026-02-24: CI test workflow trigger scope adjusted: `pnpm test` now runs on all pull requests and on pushes to `main`/`develop`.
- 2026-02-24: Fixed API typecheck baseline errors: removed direct Prisma enum imports from `prisma/seed.ts`, added explicit service callback/transaction typing across API modules, and aligned docs for type-safety quality gate.
- 2026-02-24: JTR-7 completed: Vitest infrastructure added for API/Web/Shared, initial critical-path tests added (auth/sync/guards + Pinia auth/sync stores + shared sync/RBAC contracts), docs updated.
- 2026-02-24: JTR-11 completed: API/Web Dockerfiles migrated to multi-stage builds, `docker/.dockerignore` added, and Render docker command aligned with lean runtime image startup.
- 2026-02-24: Fixed P0 security follow-up: cookie `secure` flag now supports explicit `COOKIE_SECURE`, logout now recreates clean RxDB instance for same-tab re-login, sync clientId reset behavior tightened; docs and Render env updated.
- 2026-02-23: Added `.idea` to repository `.gitignore`; documented VCS hygiene in system design docs.
- 2026-02-23: Frontend RxDB mutation API fixed for v16 compatibility (`atomicPatch` -> `incrementalPatch`) in sync/offline flows; docs updated.
- 2026-02-23: Added separate Docker images/containers for frontend (`jtrack-web`) and backend (`jtrack-api`), updated compose runtime and docs.
- 2026-02-23: Fixed API container entrypoint to run compiled Nest output from `/app/packages/tsconfig/dist/src/main.js` after migrations.
- 2026-02-23: Compose image names standardized from `docker-*` to `jtrack-*`.
- 2026-02-23: DB network alias standardized to `jtrack`; API DATABASE_URL now targets `@jtrack:5432`.
- 2026-02-23: Marked migration `20260223082027_init` as legacy no-op to prevent `prisma migrate deploy` failure on clean DB.
- 2026-02-23: Fixed API build output path by setting `apps/api/tsconfig.json` `outDir: dist`; Docker API start now uses package script again.
- 2026-02-23: Updated API start script to `node dist/src/main.js` to match Nest build output layout.
- 2026-02-23: Added cloud deploy configs: backend on Render (`render.yaml`), frontend on Vercel (`vercel.json`).
- 2026-02-23: Render DB resource finalized as `jtrack-db` and linked to backend `DATABASE_URL`.
