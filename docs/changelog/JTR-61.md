# JTR-61

- Date: 2026-02-27
- Scope: implement invite member modal and invite API flow

## What changed

- Added `apps/web/components/team/InviteMemberModal.vue` with:
  - fields: `Email`, `Full name`, role card selector (`Owner`, `Manager`, `Technician`)
  - validation for required fields and email format
  - submit flow to `POST /users/invite` via `teamStore.inviteMember`
  - success/error toasts, loading state, form reset and close behavior
- Integrated modal into Team list page:
  - replaced placeholder modal in `apps/web/pages/team/index.vue`
  - kept `+ Invite Member` action and wired real invite submission
  - switches to `Invited` tab after successful invite
- Updated UI plan task matrix to mark `JTR-61` as complete.

## Files

- `apps/web/components/team/InviteMemberModal.vue`
- `apps/web/pages/team/index.vue`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-61.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
