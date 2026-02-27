# 2026-02-27 — Vercel login refresh 404 fix

## Summary

- Fixed `404: NOT_FOUND` on direct reload of `/login` in Vercel deployment.

## Changes

- Updated `/Users/vlad/Projects/JTrack/vercel.json`:
  - reverted `outputDirectory` to `apps/web/.output/public`
- Updated `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts` route rules:
  - added `'/login': { prerender: true }`
  - kept `'/': { prerender: true }`
  - kept `'/**': { prerender: false }`
- Updated deployment notes in `/Users/vlad/Projects/JTrack/docs/architecture.md`.

## Why

- With static SPA hosting, direct refresh on a route can return 404 if that route has no prerendered entrypoint and rewrite handling is bypassed/misaligned.
- Explicitly prerendering `/login` guarantees `login/index.html` exists in static output.
