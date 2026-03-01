# 2026-03-01 Web API Base Default (3011)

- Date: 2026-03-01
- Scope: fix web client calling `localhost:3001` when running local stack on `3010/3011`.

## What changed

- Updated `apps/web/nuxt.config.ts` default `runtimeConfig.public.apiBase` fallback:
  - from `http://localhost:3001`
  - to `http://localhost:3011`

## Why

- Nuxt client config is embedded at build-time for this setup (`ssr: false`), so when `NUXT_PUBLIC_API_BASE` is not set during image build, client JS was hardcoding `3001`.
- Local docker setup now runs frontend on `3010` and API on `3011`.

## Verification

- Rebuild web image and restart container.
- Fetch `/` HTML and verify:
  - `window.__NUXT__.config.public.apiBase` equals `http://localhost:3011`.
