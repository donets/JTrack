# JTrack UI/UX Implementation Plan

## Context

JTrack — offline-first field-service CRM. Фронтенд (Nuxt 4 + Vue 3 + Tailwind + RxDB) имеет рабочий core (auth, sync, tickets CRUD), но UI примитивный: нет component library, нет sidebar layout, нет dashboard. Мокапы в `docs/ui-requirements/` определяют полный UI с 14-step build order. Цель — построить production-quality UI, следуя мокапам и build-order.

---

## Part 1: UI-Kit (28 компонентов)

Все компоненты в `apps/web/components/ui/` (Nuxt auto-import). Без внешних UI-библиотек — чистый Tailwind.

### 1.0 Design Tokens
**File**: `apps/web/tailwind.config.ts`
- Добавить цвета: `sky`, `rose`, `violet` с light-вариантами
- Обновить `mint`, `flame` на объекты с `DEFAULT` + `light`
- Добавить spacing: `sidebar: 240px`, `sidebar-collapsed: 64px`, `topbar: 56px`, `bottom-nav: 64px`

### 1.1 Layout Components (`components/ui/`)
| Component | Props | Priority |
|-----------|-------|----------|
| `JButton` | variant: primary/secondary/ghost/danger, size, loading, icon | P0 |
| `JCard` | title?, padding? | P0 |
| `JPageHeader` | title, description?, action slot | P0 |

### 1.2 Data Display
| Component | Props | Priority |
|-----------|-------|----------|
| `JBadge` | variant: mint/flame/sky/rose/violet/mist, size: sm/md | P0 |
| `JAvatar` | name, src?, size: sm/md/lg | P0 |
| `JTable` | columns[], rows[], sortable?, loading? (scoped slots для ячеек) | P0 |
| `JStatCard` | label, value, trend?, icon? | P1 |
| `JTimeline` | items: TimelineItem[] | P1 |
| `JProgress` | value, max?, variant? | P2 |
| `JEmptyState` | title, description?, icon?, action? | P0 |

### 1.3 Inputs
| Component | Props | Priority |
|-----------|-------|----------|
| `JInput` | modelValue, label?, placeholder?, error?, type? | P0 |
| `JTextarea` | modelValue, label?, rows? | P1 |
| `JSelect` | modelValue, options[], label?, placeholder? | P0 |
| `JSearchInput` | modelValue, placeholder?, debounce? (300ms) | P0 |
| `JCheckbox` | modelValue, label? | P1 |
| `JDatePicker` | modelValue, label?, min?, max? | P1 |

### 1.4 Feedback
| Component | Props | Priority |
|-----------|-------|----------|
| `JModal` | modelValue, title?, size: sm/md/lg. Focus trap, close on Escape/backdrop | P0 |
| `JToast` | Managed via `useToast()` composable. Fixed top-right stack. | P0 |
| `JDropdown` | items[], align: left/right. Keyboard nav. | P1 |
| `JSkeleton` | variant: text/circle/rect, width?, height? | P1 |
| `JSpinner` | size: sm/md/lg | P0 |

### 1.5 Domain Components (`components/domain/`)
| Component | Used By | Priority |
|-----------|---------|----------|
| `TicketKanbanCard` | Kanban board | P1 |
| `TicketKanbanColumn` | Kanban board | P1 |
| `DispatchGanttRow` | Dispatch board | P2 |
| `DispatchTimeGrid` | Dispatch board | P2 |
| `CalendarGrid` | Calendar view | P2 |
| `InvoiceLineItems` | Invoice detail | P2 |

### 1.6 Review Follow-Up (2026-02-27)
- Closed critical UI-kit review issues:
  - `JTR-40`: fixed date-only timezone round-trip in `JDatePicker`
  - `JTR-38`: aligned `JTimeline` with flat wireframe layout
  - `JTR-36`: removed invalid nested interactive HTML in `JEmptyState`
- Closed cross-cutting hardening tasks:
  - replaced `getCurrentInstance().uid` with `useId()` in form controls
  - added missing ARIA semantics (`JTabs`, `JTable`, `JDropdown`, `JToast`, form fields)
  - added shared UI type exports in `apps/web/types/ui.ts`
  - completed missing token variants `ink.light` and `mist.dark`

---

## Part 2: Layout System

### Архитектура
```
layouts/default.vue (CSS Grid)
├── AppSidebar (components/layout/)
│   240px expanded / 64px collapsed / mobile overlay drawer
├── AppTopbar (components/layout/)
│   56px: hamburger + breadcrumbs + search + sync dot + location switcher + bell + avatar
├── <slot /> (page content, scrollable)
└── AppBottomNav (components/layout/)
    Mobile only: Home, Jobs, Schedule, Clients, More
```

### Responsive breakpoints
| Breakpoint | Sidebar | Bottom Nav |
|------------|---------|------------|
| < 768px | Hidden (drawer) | Visible |
| 768-1024px | Collapsed (64px) | Hidden |
| > 1024px | Expanded (240px) | Hidden |

### Composables
- `useLayoutState()` — `sidebarCollapsed`, `mobileDrawerOpen` (module-level refs)
- `useBreadcrumbs()` — reactive breadcrumb array, `setBreadcrumbs()` per page
- `useRbacGuard()` — `hasPrivilege(key)`, reads role from locationStore, maps via `@jtrack/shared` rbac

### Sidebar Nav Items (RBAC-filtered)
Из мокапа `01-shell-nav.html`:
1. Dashboard `/dashboard` — All roles
2. Tickets `/tickets` — tickets.read
3. Dispatch `/dispatch` — dispatch.manage
4. Customers `/customers` — locations.read (future)
5. Quotes `/quotes` — billing.manage (future)
6. Invoices `/invoicing` — payments.read
7. Team `/team` — users.read
8. Inventory `/inventory` — billing.manage (future)
9. Reports `/analytics` — Owner/Manager
10. Settings `/settings` — Owner/Manager (future)

### Миграция
- Создать `layouts/default.vue`, `layouts/auth.vue` (для login)
- Удалить `<AppShell>` из всех страниц
- `login.vue`: `definePageMeta({ layout: 'auth' })`
- `index.vue`: редирект на `/dashboard`

---

## Part 3: Views (build order 3-14)

### Step 3: App Shell & Nav — **L**
Реализация layout system (см. Part 2).

### Step 4: Ticket List Enhancement — **M**
- Route: `/tickets` (существует, рефакторить)
- Добавить: JTable с sortable columns, JSearchInput, status/priority/assignee JSelect фильтры, пагинация
- Данные: RxDB subscription + client-side filter/sort/paginate

### Step 5: Ticket Detail Enhancement — **L**
- Route: `/tickets/[id]` (существует, рефакторить)
- Two-column layout: left (description card + JTimeline activity + comment form + attachments) + right (details card + financial card + checklist card)
- Activity timeline: merge comments + status changes + payments chronologically

### Step 6: Dashboard — **M**
- Route: `/dashboard` (новая страница)
- `useDashboardStats` composable: aggregates из RxDB (open tickets, completed MTD, revenue)
- Owner/Manager: stat cards + status distribution bar + unassigned tickets table + team availability + activity feed
- Technician: "My Day" — stats (jobs/completed/remaining) + next job card + today's schedule table

### Step 7: Team Management — **M**
- Routes: `/team`, `/team/[id]`
- `useTeamStore` Pinia store: fetch `/users` для active location
- Team list: JTable + JAvatar + role/status JBadge
- Invite modal: email + name + role picker
- Member detail: profile + jobs tab + stats + role change

### Step 8: Kanban Board — **L**
- Route: `/tickets?view=board` (tab в tickets)
- Колонки по TicketStatus, карточки с drag-and-drop (HTML5 DnD API)
- Drop = PATCH status через useOfflineRepository

### Step 9: Dispatch Board — **XL**
- Route: `/dispatch` (существует, переписать)
- Gantt-grid: tech rows x time columns (7am-7pm)
- Unassigned sidebar: draggable карточки
- Drag-to-schedule: set assignedToUserId + scheduledStartAt/EndAt

### Step 10: Invoicing & Payments — **M**
- Routes: `/invoicing`, `/invoicing/[id]`
- Invoice list: tickets filtered by Invoiced/Paid status + payments
- Record payment modal: amount, provider, date, notes

### Step 11: Calendar & Map — **L**
- Route: `/calendar`
- Week/day grid, ticket events positioned by scheduledStartAt/EndAt
- Map: stub (requires coordinates — future backend entity)

### Step 14: Analytics — **L**
- Route: `/analytics`
- Stat cards + SVG bar charts (tickets by status, revenue trend) + team performance table + CSV export

### Steps 12-13: Customers & Quoting — **DEFERRED**
- Placeholder pages с JEmptyState "Coming soon"
- Blocked by new backend entities (Customer, Site, Quote)

---

## Part 4: Linear Tasks (JTR-23 → JTR-83)

### Epic 1: UI-Kit Foundation (28pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-23 | Extend Tailwind design tokens (done 2026-02-27) | 1pt |
| 2 | JTR-24 | Create JButton (done 2026-02-27) | 2pt |
| 3 | JTR-25 | Create JInput + JTextarea (done 2026-02-27) | 2pt |
| 4 | JTR-26 | Create JSelect (done 2026-02-27) | 1pt |
| 5 | JTR-27 | Create JBadge (done 2026-02-27) | 1pt |
| 6 | JTR-28 | Create JAvatar (done 2026-02-27) | 1pt |
| 7 | JTR-29 | Create JCard (done 2026-02-27) | 1pt |
| 8 | JTR-30 | Create JModal (done 2026-02-27) | 3pt |
| 9 | JTR-31 | Create JToast system (done 2026-02-27) | 2pt |
| 10 | JTR-32 | Create JTable (done 2026-02-27) | 3pt |
| 11 | JTR-33 | Create JSearchInput (done 2026-02-27) | 1pt |
| 12 | JTR-34 | Create JDropdown (done 2026-02-27) | 2pt |
| 13 | JTR-35 | Create JSpinner + JSkeleton (done 2026-02-27) | 1pt |
| 14 | JTR-36 | Create JEmptyState (done 2026-02-27) | 1pt |
| 15 | JTR-37 | Create JStatCard (done 2026-02-27) | 1pt |
| 16 | JTR-38 | Create JTimeline (done 2026-02-27) | 2pt |
| 17 | JTR-39 | Create JProgress + JCheckbox (done 2026-02-27) | 2pt |
| 18 | JTR-40 | Create JDatePicker (done 2026-02-27) | 2pt |
| 19 | JTR-41 | Create JTabs (done 2026-02-27) | 2pt |

### Epic 1.1: Missing Design System Components (JTR-97)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-121 | Create JPagination component (done 2026-02-27) | 1pt |
| 2 | JTR-122 | Create JPageHeader component (done 2026-02-27) | 1pt |
| 3 | JTR-97 | Add missing design system components (parent, done 2026-02-27) | 2pt |

### Epic 2: App Shell & Navigation (17pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-42 | useLayoutState + useBreadcrumbs (done 2026-02-27) | 1pt |
| 2 | JTR-43 | useRbacGuard (done 2026-02-27) | 1pt |
| 3 | JTR-44 | AppSidebar (done 2026-02-27) | 5pt |
| 4 | JTR-45 | AppTopbar (done 2026-02-27) | 4pt |
| 5 | JTR-46 | AppBottomNav (done 2026-02-27) | 2pt |
| 6 | JTR-47 | Default layout + page migration (done 2026-02-27) | 5pt |

### Epic 3: Ticket Views Enhancement (20pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-48 | Refactor ticket list (JTable + filters) (done 2026-02-27) | 5pt |
| 2 | JTR-49 | Ticket creation modal (done 2026-02-27) | 3pt |
| 3 | JTR-50 | Ticket detail two-column layout | 5pt |
| 4 | JTR-51 | Ticket status change workflow | 3pt |
| 5 | JTR-52 | Ticket edit modal + financial card | 3pt |
| 6 | JTR-53 | Ticket status badge mapping utility (done 2026-02-27) | 1pt |

### Epic 4: Dashboard (11pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-54 | Create dashboard page route (done 2026-02-27) | 1pt |
| 2 | JTR-55 | Create useDashboardStats composable (done 2026-02-27) | 3pt |
| 3 | JTR-56 | Build owner/manager dashboard (done 2026-02-27) | 3pt |
| 4 | JTR-57 | Build technician day view (done 2026-02-27) | 3pt |
| 5 | JTR-58 | Role-based dashboard switching (done 2026-02-27) | 1pt |

### Epic 5: Team Management (13pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-59 | Create useTeamStore | 3pt |
| 2 | JTR-60 | Create team list page | 3pt |
| 3 | JTR-61 | Create invite member modal | 3pt |
| 4 | JTR-62 | Create member detail page | 3pt |
| 5 | JTR-63 | RBAC guards for team pages | 1pt |

### Epic 6: Kanban & Dispatch (27pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-64 | Create TicketKanbanCard | 2pt |
| 2 | JTR-65 | Create TicketKanbanColumn | 3pt |
| 3 | JTR-66 | Create kanban board view | 5pt |
| 4 | JTR-67 | Create DispatchTimeGrid | 3pt |
| 5 | JTR-68 | Create DispatchGanttRow | 4pt |
| 6 | JTR-69 | Dispatch unassigned sidebar | 3pt |
| 7 | JTR-70 | Rewrite dispatch board page | 5pt |
| 8 | JTR-71 | Ticket quick-assign modal | 2pt |

### Epic 7: Financial Views (10pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-72 | Create invoice list page | 3pt |
| 2 | JTR-73 | Create invoice detail page | 3pt |
| 3 | JTR-74 | Create record payment modal | 2pt |
| 4 | JTR-75 | Payment status update logic | 2pt |

### Epic 8: Calendar & Map (12pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-76 | Create CalendarGrid component | 5pt |
| 2 | JTR-77 | Create useCalendarEvents composable | 2pt |
| 3 | JTR-78 | Create calendar page | 4pt |
| 4 | JTR-79 | Create map page stub | 1pt |

### Epic 9: Future & Analytics (9pt)
| # | Linear | Task | Est |
|---|--------|------|-----|
| 1 | JTR-80 | Customers placeholder page | 1pt |
| 2 | JTR-81 | Quotes placeholder page | 1pt |
| 3 | JTR-82 | Create analytics page | 5pt |
| 4 | JTR-83 | CSV export utility | 2pt |

---

## Verification

```bash
# After each epic:
pnpm lint
pnpm typecheck

# Manual testing:
# 1. Open http://localhost:3000, login with demo credentials
# 2. Verify sidebar navigation (desktop expanded/collapsed, mobile drawer)
# 3. Check responsive behavior at 375px, 768px, 1280px
# 4. Test offline: disconnect network, verify sync dot turns orange, create ticket, reconnect
# 5. Verify RBAC: login as technician, confirm restricted nav items hidden
```

## Total: ~159 story points across 9 epics
