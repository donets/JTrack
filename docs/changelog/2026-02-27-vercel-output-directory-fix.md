# 2026-02-27 — Vercel output directory fix

## Summary

- Fixed Vercel `404: NOT_FOUND` by aligning publish directory with Nuxt output in Vercel environment.

## Changes

- Updated `/Users/vlad/Projects/JTrack/vercel.json`:
  - changed `outputDirectory` from `apps/web/.output/public` to `apps/web/.vercel/output/static`
- Updated deployment notes in `/Users/vlad/Projects/JTrack/docs/architecture.md`.

## Why

- In Vercel (`VERCEL=1`), Nuxt uses `vercel-static` preset and writes static artifacts to `.vercel/output/static`.
- Publishing `.output/public` in that environment results in missing deploy output and `404: NOT_FOUND`.
