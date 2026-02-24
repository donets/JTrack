# JTR-15

- Date: 2026-02-24
- Scope: unify API validation on controller-level `ZodValidationPipe`

## What changed

- Standardized request validation in API controllers to `ZodValidationPipe` for:
  - auth refresh
  - users create/invite/update
  - locations create/update
  - tickets list/create/update/status
  - comments create
  - attachments presign/upload/metadata
  - payments create/status
  - sync pull/push
- Removed duplicate `schema.parse()` validation from service layer and switched method inputs to typed contracts.
- Added missing shared schemas/types used by controller pipes:
  - `refreshInputSchema`
  - `ticketStatusUpdateInputSchema`
  - `paymentStatusUpdateInputSchema`
  - `presignInputSchema`
  - `uploadInputSchema`

## Files

- `apps/api/src/**/**.controller.ts` (validation pipes)
- `apps/api/src/**/**.service.ts` (removed duplicate parses, typed inputs)
- `packages/shared/src/schemas.ts`
- `docs/changelog/JTR-15.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
