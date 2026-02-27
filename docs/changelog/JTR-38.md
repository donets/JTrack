# JTR-38

- Date: 2026-02-27
- Scope: add timeline component for activity feeds

## What changed

- Added `JTimeline` at `apps/web/components/ui/JTimeline.vue`.
- Implemented required `items` prop with `TimelineItem[]` shape:
  - `id`
  - `type` (`comment | status_change | payment | attachment`)
  - `actor` (`name`, `avatarUrl?`)
  - `content`
  - `timestamp`
- Added vertical timeline layout with:
  - event dot markers on the left
  - actor avatar + name
  - event type label
  - timestamp rendering
  - event content body
- Added visual differentiation for event types via color-coded markers.
- Synced UI plan task list with implementation status.

## Files

- `apps/web/components/ui/JTimeline.vue`
- `docs/plans/ui-ux-plan.md`

## Verification

- `pnpm lint`
- `pnpm typecheck`

## Review follow-up (2026-02-27)

- Reworked `JTimeline` presentation to match the flat wireframe:
  - removed card-per-item container
  - kept vertical line + event dots with compact text rows
- Moved timeline type contracts to shared `apps/web/types/ui.ts` so `TimelineItem` can be imported by consumers.
