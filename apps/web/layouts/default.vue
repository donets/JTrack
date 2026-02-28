<template>
  <div
    class="h-dvh bg-mist text-ink md:h-screen"
    :style="{
      '--sidebar-width': sidebarCollapsed ? '4rem' : '15rem',
      '--bottom-nav-height': '4rem'
    }"
  >
    <div class="grid h-full grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[64px_minmax(0,1fr)] md:grid-rows-[3.5rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <AppSidebar
        v-model:collapsed="sidebarCollapsed"
        v-model:mobile-open="mobileDrawerOpen"
        class="md:row-span-2"
      />

      <AppTopbar class="md:col-start-2 md:row-start-1" />

      <main
        class="min-h-0 overflow-y-auto px-4 py-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:col-start-2 md:row-start-2 md:px-6 md:py-6 md:pb-6"
      >
        <slot />
      </main>
    </div>

    <AppBottomNav />
    <JToast />
  </div>
</template>

<script setup lang="ts">
const { sidebarCollapsed, mobileDrawerOpen } = useLayoutState()
</script>
