# JTR-49

- Date: 2026-02-27
- Scope: replace inline ticket creation form with modal-based flow on `/tickets`

## What changed

- Replaced inline ticket form in `apps/web/pages/tickets/index.vue` with `JModal` opened from header action (`+ New Ticket`).
- Implemented modal form fields with design-system controls:
  - `JInput` title (required)
  - `JTextarea` description
  - `JSelect` priority
  - `JSelect` assignee (team members)
  - `JDatePicker` scheduled start/end
  - `JInput` amount
  - `JSelect` currency
- Added client-side validation for required title, amount parsing, and date-range consistency.
- On submit, modal calls `useOfflineRepository.saveTicket()`, shows `JToast` success/error, closes modal, syncs (`syncNow`), and navigates to the created ticket.
- Updated UI plan task matrix to mark `JTR-49` as completed.

## Files

- `apps/web/pages/tickets/index.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-49.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
