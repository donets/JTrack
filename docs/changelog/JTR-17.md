# JTR-17

- Date: 2026-02-24
- Scope: fix Prisma migrate script naming behavior

## What changed

- Updated `@jtrack/api` script:
  - from: `prisma migrate dev --name init`
  - to: `prisma migrate dev`
- Added migration usage notes in `README.md`:
  - default interactive naming via `pnpm db:migrate`
  - explicit naming via `pnpm db:migrate -- --name <migration_name>`
- Updated operability note in system design docs to reflect the new migration flow.

## Files

- `apps/api/package.json`
- `README.md`
- `docs/system-design.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
