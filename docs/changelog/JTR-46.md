# JTR-46

- Date: 2026-02-27
- Scope: create mobile bottom navigation for app shell

## What changed

- Added `apps/web/components/layout/AppBottomNav.vue`.
- Implemented fixed mobile-only bottom navigation:
  - `Home` (`/dashboard`)
  - `Jobs` (`/tickets`)
  - `Schedule` (`/dispatch`)
  - `Clients` (`/customers`)
  - `More` action opening sidebar drawer
- Applied active-route state with mint highlight.
- Set navigation height to `bottom-nav` token (`64px`).

## Files

- `apps/web/components/layout/AppBottomNav.vue`
- `docs/changelog/JTR-46.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
