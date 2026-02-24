import { getActiveDatabase } from '~/plugins/rxdb.client'

export const useRxdb = () => {
  return getActiveDatabase()
}
