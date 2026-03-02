<template>
  <section class="space-y-4" aria-label="Dispatch loading skeleton">
    <section class="rounded-xl border border-slate-200 bg-white px-3 sm:px-5">
      <div class="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div class="flex min-w-max border-b-2 border-slate-200">
          <JSkeleton
            v-for="index in 3"
            :key="`dispatch-tab-skeleton-${index}`"
            class="mx-1 my-2 shrink-0"
            width="104px"
            height="28px"
          />
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <article class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <JSkeleton width="168px" height="18px" />
          <div class="inline-flex items-center gap-2">
            <JSkeleton width="84px" height="30px" />
            <JSkeleton width="84px" height="30px" />
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="row in 5"
            :key="`dispatch-row-skeleton-${row}`"
            class="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-3"
          >
            <JSkeleton height="16px" />
            <JSkeleton height="54px" />
          </div>
        </div>
      </article>

      <article class="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <JSkeleton width="40%" height="14px" />
        <JSkeleton
          v-for="index in 5"
          :key="`dispatch-unassigned-skeleton-${index}`"
          height="64px"
        />
      </article>
    </section>
  </section>
</template>
