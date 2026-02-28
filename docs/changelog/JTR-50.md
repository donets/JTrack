# JTR-50

- Date: 2026-02-27
- Scope: refactor `/tickets/[id]` into two-column detail layout with activity and sidebar cards

## What changed

- Rebuilt `apps/web/pages/tickets/[id].vue` into the target ticket-detail structure:
  - left column: description card, merged activity timeline, comment composer, attachments card with drag-drop upload area
  - right column: details card, financial summary card, checklist card (`JProgress` + `JCheckbox`)
- Added ticket top header with breadcrumb/title, status badge, and action buttons (`Edit`, `Cancel`).
- Added mobile quick-action row (`Start Job`, `Navigate`, `Call`) with responsive stacking for narrow screens.
- Added timeline merging logic across comments, synthetic status events, and payment records sorted chronologically.
- Expanded local RxDB subscriptions on detail page to include `paymentRecords` alongside ticket/comments/attachments.
- Updated UI plan task matrix to mark `JTR-50` as completed.

## Files

- `apps/web/pages/tickets/[id].vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-50.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
