# 2026-03-01 — Dispatch drop-zone highlight improvement

## Summary
- Improved visual feedback for drag-and-drop scheduling in dispatch timeline rows.

## Changes
- Updated `apps/web/components/domain/DispatchGanttRow.vue`:
  - Added stronger active drop-zone highlight (`bg-sky-light`, inset ring, dashed border).
  - Added centered helper label while dragging: `Drop to assign and schedule`.
  - Added `dragenter` handling with drag-depth tracking to avoid highlight flicker during nested drag events.
  - Reset drag-depth state on drop for stable highlight teardown.

## Files
- `apps/web/components/domain/DispatchGanttRow.vue`
- `docs/changelog/2026-03-01-dispatch-dropzone-highlight.md`
