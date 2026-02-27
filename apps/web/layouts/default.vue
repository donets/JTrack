<template>
  <div class="h-screen bg-mist text-ink">
    <div class="grid h-full md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-[56px_minmax(0,1fr)]">
      <AppSidebar
        v-model:collapsed="sidebarCollapsed"
        v-model:mobile-open="mobileDrawerOpen"
        class="md:row-span-2"
      />

      <AppTopbar class="md:col-start-2 md:row-start-1" />

      <main class="min-h-0 overflow-y-auto px-4 py-4 pb-[5.5rem] md:col-start-2 md:row-start-2 md:px-6 md:py-6 md:pb-6">
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
