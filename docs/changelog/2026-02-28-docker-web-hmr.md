# Docker Web HMR Mode

- Date: 2026-02-28
- Scope: local developer workflow for frontend hot-reload without rebuilds

## What changed

- Added `docker/docker-compose.dev.yml` as a compose override for development.
- In override mode, `web` service:
  - uses `docker/Dockerfile.web` `base` stage,
  - bind-mounts repository sources into `/app`,
  - runs `nuxt dev` on `0.0.0.0:3010`,
  - enables polling file watcher settings for reliable host-to-container HMR.
- Documented HMR workflow in:
  - `README.md`
  - `docs/architecture.md`
  - `docs/system-design.md`

## How to run

```bash
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

## Verification

- `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml config`
- `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d web`
- `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs --tail=80 web`
