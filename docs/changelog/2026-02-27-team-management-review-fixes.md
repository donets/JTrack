# 2026-02-27 Team Management Review Fixes

## Scope

Follow-up fixes for Epic 5 (`codex/team`) based on consolidated review findings.

## What changed

- Fixed critical role update flow:
  - switched frontend role updates from `POST /users` to `PATCH /users/:id`
  - expanded shared `UpdateUserInput` with `role` + `membershipStatus`
  - updated API `users.update` to apply location membership changes (`UserLocation`) in active location context
- Added lifecycle management in member detail:
  - `Suspend/Activate` and `Remove` actions in header
  - role + status settings card with persisted save flow
- Added missing Team UI parity updates:
  - member detail tabs now include `Jobs`, `Schedule`, `Time Log`
  - members table now includes `Jobs (MTD)` and email subline under member name
  - invite modal role options now exclude `Owner`
- Accessibility and design-system fixes:
  - RBAC matrix moved to `JTable`
  - added row-header support to `JTable` (`scope="row"`) via `TableColumn.rowHeader`
  - added `aria-label` for matrix checkmark/dash values
  - added tabpanel wiring with `aria-controls`/`role="tabpanel"` support through `JTabs` id/panel prefixes
  - added radio semantics for invite role cards
- DX/refactor improvements:
  - extracted duplicated Team access guard into `useTeamAccessGuard`
  - extracted duplicated role/status presentation helpers into `utils/teamDisplay`
  - replaced `catch (error: any)` with `catch (error: unknown)` + narrowing in team store
- Invitation actions:
  - added loading guards and confirmations
  - `Revoke` now performs actual member removal via API
  - invitation status now comes from API membership status mapping (not hardcoded)

## Files

- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.service.ts`
- `apps/web/components/team/InviteMemberModal.vue`
- `apps/web/components/ui/JTable.vue`
- `apps/web/components/ui/JTabs.vue`
- `apps/web/composables/useTeamAccessGuard.ts`
- `apps/web/pages/team/index.vue`
- `apps/web/pages/team/[id].vue`
- `apps/web/stores/team.ts`
- `apps/web/types/ui.ts`
- `apps/web/utils/teamDisplay.ts`
- `packages/shared/src/schemas.ts`
- `docs/api-spec.yml`
- `docs/architecture.md`
- `docs/data-models.ts`
- `docs/changelog/2026-02-27-team-management-review-fixes.md`
