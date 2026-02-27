# Render Startup Fix (Prisma + Port + Demo Seed)

- Date: 2026-02-27
- Scope: fix Render backend startup failures and restore demo login credentials on Render

## What changed

- Updated `docker/Dockerfile.api` startup command:
  - replaced dynamic `find ./node_modules/.pnpm ...` lookup with direct Prisma CLI path
  - now runs `node apps/api/node_modules/prisma/build/index.js migrate deploy --schema apps/api/prisma/schema.prisma`
- Updated `docker/Dockerfile.api` startup flow:
  - if `SEED_DEMO_DATA=true`, runs `node apps/api/dist/prisma/seed.js` before API start
- Removed Render `dockerCommand` override from `render.yaml` so runtime uses Dockerfile `CMD` directly.
- Updated API bootstrap in `apps/api/src/main.ts` to read port from `API_PORT`, fallback to `PORT`, then default to `3001`.
- Added `SEED_DEMO_DATA=true` in `render.yaml` env vars for demo environments so `owner@demo.local / password123` is provisioned.
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
