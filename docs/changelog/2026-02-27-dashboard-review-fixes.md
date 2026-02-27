# 2026-02-27 Dashboard Review Fixes

- Date: 2026-02-27
- Scope: post-review hardening for Epic Dashboard PR

## What changed

- Fixed critical partial update corruption in `useOfflineRepository.saveTicket()`:
  - existing ticket data is now used as the base state for updates
  - partial updates only override explicitly provided fields
  - preserves title/description/assignee/priority/etc. when updating status only
- Added error handling for technician "Start Job" action:
  - failures in `saveTicket` or `syncNow` now surface via error toast
- Improved dashboard accessibility and UI alignment:
  - status distribution bar now has `role=\"img\"` and descriptive `aria-label`
  - removed hardcoded hex value colors in stat cards in favor of CSS token vars
  - unassigned table CTA label adjusted from `Open` to `Assign`

## Files

- `apps/web/composables/useOfflineRepository.ts`
- `apps/web/components/dashboard/TechnicianDashboard.vue`
- `apps/web/components/dashboard/OwnerManagerDashboard.vue`
- `docs/changelog/2026-02-27-dashboard-review-fixes.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
