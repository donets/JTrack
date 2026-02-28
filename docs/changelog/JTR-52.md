# JTR-52

- Date: 2026-02-27
- Scope: add ticket edit modal and complete financial card payment flow on ticket detail page

## What changed

- Added **Edit Ticket** modal to `apps/web/pages/tickets/[id].vue`:
  - prefilled from current ticket state
  - same form surface as create modal (title, description, priority, assignee, schedule, amount, currency)
  - validation for title, amount, and date range
  - save path computes incremental patch and calls `useOfflineRepository.saveTicket()`
  - success/error toast + sync
- Added **Record Payment** modal from financial card:
  - amount, provider, date, notes fields
  - submission calls `useOfflineRepository.addPaymentRecord()`
  - optional note persisted as ticket comment
  - success/error toast + sync
- Financial card now operates as functional sidebar surface (total / paid / balance + active record-payment action).
- Updated `apps/web/composables/useOfflineRepository.ts` `saveTicket` input typing to explicitly support nullable patch fields used by edit workflows.
- Updated UI plan task matrix to mark `JTR-52` as completed.

## Files

- `apps/web/pages/tickets/[id].vue`
- `apps/web/composables/useOfflineRepository.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-52.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
