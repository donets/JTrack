# JTR-28

- Date: 2026-02-27
- Scope: add avatar component with deterministic color identity

## What changed

- Added `JAvatar` component at `apps/web/components/ui/JAvatar.vue`.
- Implemented props:
  - `name` (required)
  - `src` (optional image URL)
  - `size` (`sm|md|lg`)
- Added deterministic color mapping by name hash cycling through:
  - `sky`, `mint`, `violet`, `flame`
- Added initials fallback derived from name when image is missing or fails to load.
- Added image mode with graceful fallback on image load error.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JAvatar.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`
