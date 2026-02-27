<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-mist-dark bg-white md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Mobile navigation"
  >
    <ul class="grid h-bottom-nav grid-cols-5">
      <li v-for="item in routeItems" :key="item.to" class="h-full">
        <NuxtLink :to="item.to" :class="linkClasses(item.to)">
          <span class="text-base leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </li>

      <li class="h-full">
        <button type="button" class="flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500" @click="openMobileDrawer">
          <span class="text-base leading-none">⋯</span>
          <span>More</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const { openMobileDrawer } = useLayoutState()

const routeItems = [
  { label: 'Home', icon: '📊', to: '/dashboard' },
  { label: 'Jobs', icon: '🎫', to: '/tickets' },
  { label: 'Schedule', icon: '📅', to: '/dispatch' },
  { label: 'Clients', icon: '👥', to: '/customers' }
]

const isActiveRoute = (path: string) =>
  route.path === path || (path !== '/dashboard' && route.path.startsWith(`${path}/`))

const linkClasses = (path: string) => [
  'flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold',
  isActiveRoute(path) ? 'text-mint' : 'text-slate-500'
]
</script>
