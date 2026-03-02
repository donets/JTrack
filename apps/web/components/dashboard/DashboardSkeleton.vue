<template>
  <section class="space-y-4" aria-label="Dashboard loading skeleton">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="index in 4"
        :key="`dashboard-stat-skeleton-${index}`"
        class="space-y-3 rounded-lg border border-mist-dark bg-white p-4"
      >
        <JSkeleton width="42%" height="12px" />
        <JSkeleton width="30%" height="28px" />
      </article>
    </div>

    <JSkeleton width="48%" height="12px" />

    <div class="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <div class="space-y-4">
        <article class="space-y-3 rounded-lg border border-mist-dark bg-white p-4">
          <JSkeleton width="36%" height="14px" />
          <JSkeleton height="28px" />
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <JSkeleton v-for="index in 4" :key="`distribution-skeleton-${index}`" height="20px" />
          </div>
        </article>

        <article class="space-y-3 rounded-lg border border-mist-dark bg-white p-4">
          <JSkeleton width="34%" height="14px" />
          <div class="space-y-2">
            <div
              v-for="row in 5"
              :key="`unassigned-row-skeleton-${row}`"
              class="grid grid-cols-4 gap-3"
            >
              <JSkeleton />
              <JSkeleton />
              <JSkeleton />
              <JSkeleton />
            </div>
          </div>
        </article>
      </div>

      <div class="space-y-4">
        <article class="space-y-3 rounded-lg border border-mist-dark bg-white p-4">
          <JSkeleton width="40%" height="14px" />
          <div class="space-y-3">
            <div v-for="row in 4" :key="`team-row-skeleton-${row}`" class="flex items-center gap-3">
              <JSkeleton variant="circle" width="32px" height="32px" />
              <div class="flex-1 space-y-2">
                <JSkeleton width="52%" height="12px" />
                <JSkeleton width="72%" height="12px" />
              </div>
              <JSkeleton width="56px" height="20px" />
            </div>
          </div>
        </article>

        <article class="space-y-3 rounded-lg border border-mist-dark bg-white p-4">
          <JSkeleton width="44%" height="14px" />
          <div class="space-y-2">
            <JSkeleton v-for="row in 5" :key="`activity-row-skeleton-${row}`" height="18px" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
