# 2026-02-27 — Vercel NOT_FOUND root prerender fix

## Summary

- Fixed Vercel `404: NOT_FOUND` on the main page by ensuring Nuxt static build always emits the root entrypoint.

## Changes

- Updated `/Users/vlad/Projects/JTrack/apps/web/nuxt.config.ts` route rules:
  - added `'/': { prerender: true }`
  - kept `'/\*\*': { prerender: false }` for non-root routes
- Updated `/Users/vlad/Projects/JTrack/docs/architecture.md` deployment notes.

## Why

- With `ssr: false` and global prerender disabled, static output could miss root HTML entrypoint, which causes Vercel to return `404: NOT_FOUND` at `/`.
- Explicit root prerender guarantees `index` entry is generated for static hosting.
