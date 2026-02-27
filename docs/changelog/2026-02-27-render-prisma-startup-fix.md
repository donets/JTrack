# Render Prisma Startup Fix

- Date: 2026-02-27
- Scope: fix Render backend startup failure caused by dynamic Prisma CLI path lookup

## What changed

- Updated `docker/Dockerfile.api` startup command:
  - replaced dynamic `find ./node_modules/.pnpm ...` lookup with direct Prisma CLI path
  - now runs `node apps/api/node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma`
- Updated Render `dockerCommand` in `render.yaml` to use the same direct Prisma CLI path and keep `API_PORT` mapped from Render `PORT`.
- Updated deployment notes in `docs/architecture.md` to match the new startup command.

## Files

- `docker/Dockerfile.api`
- `render.yaml`
- `docs/architecture.md`
- `docs/changelog/2026-02-27-render-prisma-startup-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
