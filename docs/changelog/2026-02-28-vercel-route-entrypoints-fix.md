# 2026-02-28 — Vercel route entrypoints fix

## Summary

- Fixed `404: NOT_FOUND` on direct open/reload of key web routes in Vercel deployment.

## Changes

- Updated Nuxt route prerender entries:
  - `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts`
  - explicit prerender for:
    - `/`
    - `/login`
    - `/dashboard`
    - `/locations`
  - kept `experimental.payloadExtraction = false`
- Updated deployment architecture docs:
  - `/Users/vlad/Projects/JTrack/docs/architecture.md`
  - clarified that critical auth/navigation routes are shipped as static HTML entrypoints.

## Why

- Production Vercel instance returned `404: NOT_FOUND` for `/login` and protected route reloads, indicating SPA fallback rewrite was not reliably applied.
- Explicit static entrypoints remove dependency on runtime rewrite for these routes.

## Verification

- `pnpm --filter @jtrack/web build:mobile`
  - generated:
    - `apps/web/.output/public/login/index.html`
    - `apps/web/.output/public/dashboard/index.html`
    - `apps/web/.output/public/locations/index.html`
- confirmed no `/_payload.json` references in client bundle.
