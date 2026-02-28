# JTR-48..53 Review Fixes

- Date: 2026-02-28
- Scope: post-review hardening for Tickets Epic branch `codex/tickets`

## What changed

- Added shared formatting utility `apps/web/utils/format.ts` and removed duplicated page-level implementations from ticket list/detail pages:
  - `parseAmountToCents`
  - `formatPriorityLabel`
  - `formatDateTime`
  - `formatMoney`
  - `formatTicketCode`
  - `formatAmountInput`
- Fixed currency display precision in ticket list/detail (financial values now keep cents, `minimumFractionDigits/maximumFractionDigits = 2`).
- Reworked status workflow on ticket detail to explicit state machine rules (`VALID_TRANSITIONS`) with role constraints layered on top.
- Persisted status-change timeline events through ticket comments with a structured marker (`[status-change] from->to`) so events survive refresh.
- Added explicit error handling + toast feedback for comment submission and file upload failures.
- Adjusted tablet/mobile quick-actions visibility from `md:hidden` to `xl:hidden` so actions remain visible before desktop sidebar breakpoint.
- Fixed JTable controlled-sort behavior to avoid re-sorting already sorted page data (eliminates double-sorting).
- Added missing date-range filters (`Date from` / `Date to`) to ticket list filter bar.
- Updated ticket list date filter UI to match `docs/ui-requirements/04-tickets.html`:
  - replaced separate `Date from` / `Date to` controls with a single `Date range` select.
- Unified tickets header presentation by removing the temporary data-source subtitle and aligned `New Ticket` button height with adjacent filter controls (`size="md"`).
- Removed duplicate page-level header on `tickets/main` (`apps/web/pages/tickets/index.vue`) so route title/breadcrumbs are shown only in `AppTopbar`.
- Matched `/tickets` view styling with `main` for key UI elements:
  - switched list filters to `JListbox` (custom dropdown interaction),
  - normalized table header typography/casing/paddings on the tickets table (no uppercase tracking).
- Updated table sort indicator in `JTable` to the chevron SVG icon used in `main` (with `rotate-180` for descending sort direction).
- Removed prefixed option labels inside ticket-list dropdown filters (no `Status:`/`Priority:`/`Assigned:`/`Rows:` prefixes in option text).
- Updated table header class pattern in `JTable` to match `main` sortable header styling (`cursor-pointer select-none px-3 py-3.5 text-sm font-medium ...`) and added optional `hideClass` support on `TableColumn`; `tickets` now hides the `Updated` column on small screens via `hidden lg:table-cell`.
- Aligned `JTable` body cell spacing with `main` (`px-3 py-4 sm:px-5`) and removed temporary page-scoped table style overrides from `tickets/index.vue` so header/body classes are sourced directly from `JTable`.
- Added optional row-click support in `JTable` (`rowClickable` + `row-click` event) and enabled it on `tickets/index.vue` so clicking a table row navigates to the ticket detail page, consistent with `main`.
- Tightened `tickets/index.vue` list-toolbar layout to closer `main` parity (search placeholder `Search…`, status filter width `w-28 sm:w-40`, top/filter rows using `px-3 sm:px-5` spacing, and removed extra section padding wrapper).
- Updated checklist card in `tickets/[id].vue`: moved progress counter to its own line (`0/4`) and rendered checklist items as a semantic list (`<ul><li>`) so each checkbox is always on its own row.
- Updated `JCheckbox` cursor behavior: label area now uses `cursor-pointer` (and `cursor-not-allowed` when disabled) so checklist label hover/click affordance matches expected UX.
- Removed ticket code (`#XXXXXXXX`) from UI surfaces: tickets list column, ticket detail header/breadcrumb/activity text, and dashboard job/activity labels now show human-readable title-only strings.
- Improved form accessibility in modals by binding footer submit buttons to their forms via `form` attribute.
- Reset create-ticket modal form state on open to prevent stale draft values.
- Simplified tickets list subscription watcher to avoid redundant triggers on location change.

## Files

- `apps/web/components/ui/JTable.vue`
- `apps/web/pages/tickets/index.vue`
- `apps/web/pages/tickets/[id].vue`
- `apps/web/utils/format.ts`
- `docs/changelog/JTR-48-53-review-fixes.md`

## Verification

- `pnpm -C /Users/vlad/Projects/JTrack/apps/web lint`
- `pnpm -C /Users/vlad/Projects/JTrack/apps/web typecheck`
