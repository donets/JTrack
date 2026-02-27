# Render Startup Fix (Prisma + Port)

- Date: 2026-02-27
- Scope: fix Render backend startup failures caused by Prisma CLI path lookup and Render command override behavior

## What changed

- Updated `docker/Dockerfile.api` startup command:
  - replaced dynamic `find ./node_modules/.pnpm ...` lookup with direct Prisma CLI path
  - now runs `node apps/api/node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma`
- Removed Render `dockerCommand` override from `render.yaml` so runtime uses Dockerfile `CMD` directly.
- Updated API bootstrap in `apps/api/src/main.ts` to read port from `API_PORT`, fallback to `PORT`, then default to `3001`.
- Updated deployment notes in `docs/architecture.md` to match the new startup command.

## Files

- `docker/Dockerfile.api`
- `render.yaml`
- `apps/api/src/main.ts`
- `docs/architecture.md`
- `docs/changelog/2026-02-27-render-prisma-startup-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
