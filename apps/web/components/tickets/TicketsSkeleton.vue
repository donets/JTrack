<template>
  <section class="space-y-5" aria-label="Tickets loading skeleton">
    <section class="rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
      <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
        <JSkeleton class="min-w-[160px] flex-1" height="36px" />
        <JSkeleton width="112px" height="36px" />
        <JSkeleton width="96px" height="36px" />
      </div>

      <div class="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-4">
        <JSkeleton v-for="index in 4" :key="`tickets-filter-skeleton-${index}`" height="36px" />
      </div>

      <div class="pt-3">
        <JSkeleton width="112px" height="12px" />
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white px-3 sm:px-5">
      <div class="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div class="flex min-w-max border-b-2 border-slate-200">
          <JSkeleton
            v-for="index in 4"
            :key="`tickets-tab-skeleton-${index}`"
            class="mx-1 my-2 shrink-0"
            width="96px"
            height="28px"
          />
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
      <div class="space-y-2">
        <div v-for="row in 7" :key="`tickets-row-skeleton-${row}`" class="grid grid-cols-7 gap-3">
          <JSkeleton v-for="column in 7" :key="`tickets-cell-skeleton-${row}-${column}`" height="18px" />
        </div>
      </div>
    </section>
  </section>
</template>
