<template>
  <aside
    :class="desktopSidebarClasses"
    aria-label="Primary navigation"
  >
    <div class="flex h-topbar items-center justify-between border-b border-slate-700 px-4">
      <NuxtLink to="/dashboard" class="flex items-center gap-2 text-white">
        <span class="text-lg">⚡</span>
        <span :class="logoTextClasses">JTrack</span>
      </NuxtLink>
    </div>

    <nav class="flex-1 overflow-y-auto py-3">
      <section
        v-for="section in visibleSections"
        :key="section.label"
        class="mb-2"
      >
        <p :class="sectionLabelClasses">{{ section.label }}</p>

        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :class="itemClasses(item.to)"
          :title="showItemTitle(item.label)"
          @click="closeMobileDrawer"
        >
          <span class="text-base leading-none">{{ item.icon }}</span>
          <span :class="itemTextClasses">{{ item.label }}</span>
        </NuxtLink>
      </section>
    </nav>

    <div class="hidden border-t border-slate-700 p-3 md:block">
      <button
        type="button"
        class="flex w-full items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        aria-label="Toggle sidebar"
        @click="toggleCollapsed"
      >
        <svg
          class="size-4 transition-transform"
          :class="collapsed ? 'rotate-180' : ''"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    </div>
  </aside>

  <Transition name="drawer-backdrop-transition">
    <button
      v-if="mobileOpen"
      type="button"
      class="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
      aria-label="Close navigation drawer"
      @click="closeMobileDrawer"
    />
  </Transition>

  <Transition name="drawer-panel-transition">
    <aside
      v-if="mobileOpen"
      class="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-ink md:hidden"
      aria-label="Mobile navigation"
    >
      <div class="flex h-topbar items-center justify-between border-b border-slate-700 px-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-2 text-white" @click="closeMobileDrawer">
          <span class="text-lg">⚡</span>
          <span class="text-sm font-semibold">JTrack</span>
        </NuxtLink>
        <button
          type="button"
          class="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Close menu"
          @click="closeMobileDrawer"
        >
          ✕
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-3">
        <section
          v-for="section in visibleSections"
          :key="`mobile-${section.label}`"
          class="mb-2"
        >
          <p class="px-4 pb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {{ section.label }}
          </p>
          <NuxtLink
            v-for="item in section.items"
            :key="`mobile-${item.to}`"
            :to="item.to"
            :class="mobileItemClasses(item.to)"
            @click="closeMobileDrawer"
          >
            <span class="text-base leading-none">{{ item.icon }}</span>
            <span class="text-lg">{{ item.label }}</span>
          </NuxtLink>
        </section>
      </nav>

    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PrivilegeKey, RoleKey } from '@jtrack/shared'

type SidebarItem = {
  label: string
  icon: string
  to: string
  privilege?: PrivilegeKey
  roles?: RoleKey[]
}

type SidebarSection = {
  label: string
  items: SidebarItem[]
}

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
    mobileOpen?: boolean
  }>(),
  {
    collapsed: false,
    mobileOpen: false
  }
)

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'update:mobileOpen': [value: boolean]
}>()

const route = useRoute()
const authStore = useAuthStore()
const { activeRole, hasPrivilege } = useRbacGuard()

const sidebarSections: SidebarSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: '📊', to: '/dashboard' },
      { label: 'Tickets', icon: '🎫', to: '/tickets', privilege: 'tickets.read' },
      { label: 'Dispatch', icon: '📅', to: '/dispatch', privilege: 'dispatch.manage' },
      { label: 'Customers', icon: '👥', to: '/customers', privilege: 'locations.read' }
    ]
  },
  {
    label: 'Finance',
    items: [
      { label: 'Quotes', icon: '📝', to: '/quotes', privilege: 'billing.manage' },
      { label: 'Invoices', icon: '💰', to: '/invoicing', privilege: 'payments.read' }
    ]
  },
  {
    label: 'Manage',
    items: [
      { label: 'Team', icon: '👤', to: '/team', privilege: 'users.read' },
      { label: 'Inventory', icon: '📦', to: '/inventory', privilege: 'billing.manage' },
      { label: 'Reports', icon: '📈', to: '/reports', roles: ['Owner', 'Manager'] },
      { label: 'Settings', icon: '⚙️', to: '/settings', roles: ['Owner', 'Manager'] }
    ]
  }
]

const isItemVisible = (item: SidebarItem) => {
  if (authStore.user?.isAdmin) {
    return true
  }

  if (item.roles && !item.roles.includes(activeRole.value ?? 'Technician')) {
    return false
  }

  if (item.privilege && !hasPrivilege(item.privilege)) {
    return false
  }

  return true
}

const visibleSections = computed(() =>
  sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter(isItemVisible)
    }))
    .filter((section) => section.items.length > 0)
)

const isRouteActive = (path: string) =>
  route.path === path || (path !== '/dashboard' && route.path.startsWith(`${path}/`))


const desktopSidebarClasses = computed(() => [
  'hidden h-screen shrink-0 flex-col bg-ink md:flex',
  props.collapsed ? 'md:w-sidebar-collapsed lg:w-sidebar-collapsed' : 'md:w-sidebar-collapsed lg:w-sidebar'
])

const logoTextClasses = computed(() => [
  'text-lg font-semibold',
  props.collapsed ? 'hidden' : 'hidden lg:inline'
])

const sectionLabelClasses = computed(() => [
  'px-4 pb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500',
  props.collapsed ? 'hidden' : 'hidden lg:block'
])

const itemTextClasses = computed(() => [props.collapsed ? 'hidden' : 'hidden lg:inline'])

const showItemTitle = (label: string) => (props.collapsed ? label : undefined)

const itemClasses = (path: string) => [
  'group flex items-center gap-3 px-4 py-2.5 text-lg transition-colors',
  props.collapsed ? 'justify-center lg:justify-center' : 'justify-center lg:justify-start',
  isRouteActive(path)
    ? 'border-l-[3px] border-mint bg-slate-800 text-white'
    : 'border-l-[3px] border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
]

const mobileItemClasses = (path: string) => [
  'flex items-center gap-3 px-4 py-2.5 text-lg transition-colors',
  isRouteActive(path)
    ? 'border-l-[3px] border-mint bg-slate-800 text-white'
    : 'border-l-[3px] border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
]

const closeMobileDrawer = () => {
  emit('update:mobileOpen', false)
}

const toggleCollapsed = () => {
  emit('update:collapsed', !props.collapsed)
}

watch(
  () => route.fullPath,
  () => {
    if (props.mobileOpen) {
      closeMobileDrawer()
    }
  }
)
</script>

<style scoped>
.drawer-backdrop-transition-enter-active,
.drawer-backdrop-transition-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-backdrop-transition-enter-from,
.drawer-backdrop-transition-leave-to {
  opacity: 0;
}

.drawer-panel-transition-enter-active,
.drawer-panel-transition-leave-active {
  transition: transform 0.2s ease;
}

.drawer-panel-transition-enter-from,
.drawer-panel-transition-leave-to {
  transform: translateX(-100%);
}
</style>
