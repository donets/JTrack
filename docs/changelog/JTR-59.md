# JTR-59

- Date: 2026-02-27
- Scope: add team member Pinia store for Team Management epic

## What changed

- Added `useTeamStore` in `apps/web/stores/team.ts`.
- Implemented state: `members[]`, `loading`, `error`.
- Implemented actions:
  - `fetchMembers()` via `GET /users`
  - `inviteMember(payload)` via `POST /users/invite` with store refresh
  - `updateMemberRole(userId, role)` via role upsert on `POST /users` for active location
- Implemented getters:
  - `activeMemberCount`
  - `membersByRole` (`Owner`, `Manager`, `Technician`)
- Updated UI plan matrix to mark `JTR-59` as complete.

## Files

- `apps/web/stores/team.ts`
- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-59.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
