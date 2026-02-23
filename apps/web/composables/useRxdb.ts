export const useRxdb = () => {
  const nuxtApp = useNuxtApp()

  if (!nuxtApp.$rxdb) {
    throw new Error('RxDB is not initialized')
  }

  return nuxtApp.$rxdb
}
