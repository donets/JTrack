# 2026-03-02 — Vercel SPA Rewrite Fallback for `/tickets`

## What changed
- Added Vercel project-local config at `apps/web/vercel.json`.
- Mirrored root Vercel settings there:
  - static output directory: `.output/public`,
  - build command: `pnpm --filter @jtrack/shared build && pnpm --filter @jtrack/web build:mobile`,
  - SPA rewrite: `/(.*) -> /index.html`.
- This prevents route-level `404` (for example `/tickets`) when Vercel project uses `Root Directory = apps/web` and does not read repository-root `vercel.json`.

## Files
- `apps/web/vercel.json`
- `docs/architecture.md`

## Verification
- Confirm deployment serves `/tickets` via SPA fallback (status `200`, app shell rendered).
