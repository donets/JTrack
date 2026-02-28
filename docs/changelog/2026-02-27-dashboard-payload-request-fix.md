# 2026-02-27 — Dashboard payload request fix

## Summary

- Removed failing Nuxt static payload requests to `/dashboard/_payload.json` in Vercel deployment.

## Changes

- Updated web route prerendering strategy:
  - `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts`
  - kept root prerender: `'/': { prerender: true }`
  - removed explicit prerender for `/login` and `/dashboard`
  - kept global fallback rule: `'/**': { prerender: false }`
  - disabled Nuxt payload extraction: `experimental.payloadExtraction = false`
- Updated architecture docs:
  - `/Users/vlad/Projects/JTrack/docs/architecture.md`
  - clarified that non-root app routes use SPA rewrite fallback and are not prerendered.

## Why

- Nuxt attempts to fetch `/_payload.json` for prerendered routes during client routing.
- In Vercel static SPA deployment this produced noisy 404s for `/dashboard/_payload.json`.
- Serving `/dashboard` and `/login` through rewrite fallback removes the payload fetch requirement while keeping direct reload support.

## Verification

- `pnpm --filter @jtrack/web build:mobile`
