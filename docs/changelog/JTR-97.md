# JTR-97

- Date: 2026-02-27
- Scope: close parent issue for missing design-system components

## What changed

- Completed missing design-system component set described in `JTR-97`:
  - `JTR-121`: `JPagination` component
  - `JTR-122`: `JPageHeader` component
- Updated UI plan to mark the parent issue as completed after both child tasks were delivered.
- Follow-up UI kit review fixes (same date):
  - fixed `JDatePicker` date-only round-trip bug by emitting local `YYYY-MM-DD` values instead of forcing UTC midnight
  - reworked `JTimeline` to flat timeline rows (no nested cards), aligned with wireframe
  - fixed invalid interactive nesting in `JEmptyState` (`button` inside `a`)
  - added missing design tokens `ink.light` and `mist.dark`
  - replaced internal `getCurrentInstance().uid` IDs with `useId()` in form controls
  - moved shared UI type contracts (`TableColumn`, `DropdownItem`, `TimelineItem`, `TabItem`, `BreadcrumbItem`) to `apps/web/types/ui.ts`
  - closed accessibility gaps:
    - `aria-invalid`/`aria-describedby` in form fields
    - `aria-sort` in sortable table headers
    - `aria-haspopup`/`aria-expanded` for dropdown trigger
    - `aria-live` toast announcements
    - WAI-ARIA tab roles + keyboard arrow/Home/End navigation
    - checkbox keyboard focus-visible ring

## Files

- `docs/plans/ui-ux-plan.md`
- `docs/changelog/JTR-97.md`
- `apps/web/tailwind.config.ts`
- `apps/web/types/ui.ts`
- `apps/web/components/ui/JInput.vue`
- `apps/web/components/ui/JTextarea.vue`
- `apps/web/components/ui/JSelect.vue`
- `apps/web/components/ui/JDatePicker.vue`
- `apps/web/components/ui/JCheckbox.vue`
- `apps/web/components/ui/JBadge.vue`
- `apps/web/components/ui/JAvatar.vue`
- `apps/web/components/ui/JProgress.vue`
- `apps/web/components/ui/JToast.vue`
- `apps/web/components/ui/JDropdown.vue`
- `apps/web/components/ui/JTable.vue`
- `apps/web/components/ui/JTabs.vue`
- `apps/web/components/ui/JTimeline.vue`
- `apps/web/components/ui/JEmptyState.vue`
- `apps/web/components/ui/JPageHeader.vue`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack lint`
- `pnpm -C /Users/vlad/Projects/JTrack typecheck`
