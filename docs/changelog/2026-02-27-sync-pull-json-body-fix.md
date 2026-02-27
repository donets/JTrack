# Sync Pull JSON Body Fix

- Date: 2026-02-27
- Scope: fix `POST /sync/pull` validation failure when request body arrives as a JSON string

## What changed

- Fixed root-cause validation scope bug in API controllers:
  - `ZodValidationPipe` was applied at method level (`@UsePipes(...)`) and therefore validated non-body parameters (`@CurrentLocation`, `@CurrentUser`, `@Param`) on endpoints with multiple args
  - all affected controllers were migrated to parameter-level validation (`@Body(new ZodValidationPipe(schema))`) so only request body is validated by body schemas
  - this directly resolves `POST /sync/pull` returning `{"formErrors":["Expected object, received string"]}` when `locationId` string was validated against object schema
- Hardened API request validation in `ZodValidationPipe`:
  - string payloads are normalized via bounded `JSON.parse(...)` passes to handle JSON-string and double-string JSON bodies
  - this fixes `{"formErrors":["Expected object, received string"]}` for stringified sync payloads
- Updated web API client body handling:
  - object/array payloads are now explicitly JSON-serialized
  - `content-type: application/json` and `accept: application/json` are set by default for JSON payloads
- Added unit tests for pipe behavior with object payloads, JSON-string payloads, double-string JSON payloads, and invalid payloads.

## Files

- `apps/api/src/sync/sync.controller.ts`
- `apps/api/src/tickets/tickets.controller.ts`
- `apps/api/src/payments/payments.controller.ts`
- `apps/api/src/attachments/attachments.controller.ts`
- `apps/api/src/comments/comments.controller.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/locations/locations.controller.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/common/zod-validation.pipe.ts`
- `apps/api/src/common/zod-validation.pipe.spec.ts`
- `apps/web/composables/useApiClient.ts`
- `docs/architecture.md`
- `docs/system-design.md`
- `docs/changelog/2026-02-27-sync-pull-json-body-fix.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api test -- zod-validation.pipe.spec.ts`
- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api lint`
- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/api typecheck`
- `pnpm -C /Users/vlad/Projects/JTrack --filter @jtrack/web typecheck`
