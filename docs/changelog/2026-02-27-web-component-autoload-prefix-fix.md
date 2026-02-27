# Web Component Autoload Prefix Fix

- Date: 2026-02-27
- Scope: restore App Shell and UI component rendering in Nuxt runtime

## What changed

- Updated `apps/web/nuxt.config.ts` component auto-import config:
  - set `components.pathPrefix = false` for `~/components`.
- This aligns runtime component names with template usage (`AppSidebar`, `AppTopbar`, `AppBottomNav`, `J*`) and fixes missing render of app-shell components.

## Files

- `apps/web/nuxt.config.ts`
- `docs/changelog/2026-02-27-web-component-autoload-prefix-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
- `docker-compose -f /Users/vlad/Projects/JTrack/docker/docker-compose.yml up -d --build`
