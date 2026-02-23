import type { RxDatabase } from 'rxdb'

declare module '#app' {
  interface NuxtApp {
    $rxdb: RxDatabase
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $rxdb: RxDatabase
  }
}

export {}
