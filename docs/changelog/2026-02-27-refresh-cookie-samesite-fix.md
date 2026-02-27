# 2026-02-27 — Refresh cookie same-site fix

## Summary

- Fixed unexpected logout after page reload when frontend and API are hosted on different domains (`vercel.app` and `onrender.com`).

## Changes

- Updated backend refresh cookie options:
  - `/Users/vlad/Projects/JTrack/apps/api/src/auth/auth.service.ts`
  - added `COOKIE_SAME_SITE` support (`lax` | `strict` | `none`)
  - when `COOKIE_SAME_SITE=none`, cookie `secure` is forced to `true`
- Updated API auth service tests:
  - `/Users/vlad/Projects/JTrack/apps/api/src/auth/auth.service.spec.ts`
- Updated environment configs:
  - `/Users/vlad/Projects/JTrack/.env.example`: added `COOKIE_SAME_SITE="lax"`
  - `/Users/vlad/Projects/JTrack/render.yaml`: set `COOKIE_SAME_SITE="none"` for Render deployment
- Updated docs:
  - `/Users/vlad/Projects/JTrack/docs/architecture.md`
  - `/Users/vlad/Projects/JTrack/docs/system-design.md`
  - `/Users/vlad/Projects/JTrack/docs/auth.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
