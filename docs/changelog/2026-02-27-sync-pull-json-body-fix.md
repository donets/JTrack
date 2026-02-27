# Sync Pull JSON Body Fix

- Date: 2026-02-27
- Scope: fix `POST /sync/pull` validation failure when request body arrives as a JSON string

## What changed

- Hardened API request validation in `ZodValidationPipe`:
  - if initial schema parse fails and payload is a string, pipe now attempts `JSON.parse(...)` and re-validates
  - this fixes `{"formErrors":["Expected object, received string"]}` for stringified sync payloads
- Updated web API client body handling:
  - object/array payloads are now explicitly JSON-serialized
  - `content-type: application/json` and `accept: application/json` are set by default for JSON payloads
- Added unit tests for pipe behavior with object payloads, JSON-string payloads, and invalid payloads.

## Files

- `apps/api/src/common/zod-validation.pipe.ts`
- `apps/api/src/common/zod-validation.pipe.spec.ts`
- `apps/web/composables/useApiClient.ts`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/changelog/2026-02-27-sync-pull-json-body-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api test -- zod-validation.pipe.spec.ts`
- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api typecheck`
- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/web typecheck`
