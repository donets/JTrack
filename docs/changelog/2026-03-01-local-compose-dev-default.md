# 2026-03-01 — Local Docker default set to web dev mode

## Summary
- Switched local Docker default to run `web` in Nuxt dev mode, so frontend changes apply via HMR without image rebuild.

## Changes
- Updated `docker/docker-compose.yml`:
  - `web` build target changed to `base`
  - `web` command changed to `nuxt dev --host 0.0.0.0 --port 3010`
  - added bind-mounts and node_modules/pnpm cache named volumes for local development
  - enabled file polling envs (`CHOKIDAR_USEPOLLING`, `CHOKIDAR_INTERVAL`)
- Updated docs and local agent rules to reflect new default:
  - `README.md`
  - `docs/architecture.md`
  - `docs/system-design.md`
  - `AGENTS.md`

## Files
- `docker/docker-compose.yml`
- `README.md`
- `docs/architecture.md`
- `docs/system-design.md`
- `AGENTS.md`
- `docs/changelog/2026-03-01-local-compose-dev-default.md`

