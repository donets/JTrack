<template>
  <AppShell>
    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Dispatch Board (Stub)</h2>
      <p class="text-sm text-slate-600">
        This board is intentionally thin for now. It reads local RxDB data and can be expanded with drag and
        drop scheduling.
      </p>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold">New</h3>
          <p class="mt-2 text-sm text-slate-600">Incoming work orders</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold">Scheduled</h3>
          <p class="mt-2 text-sm text-slate-600">Assigned and planned jobs</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold">In progress</h3>
          <p class="mt-2 text-sm text-slate-600">Technician-active tickets</p>
        </article>
      </div>
    </section>
  </AppShell>
</template>
