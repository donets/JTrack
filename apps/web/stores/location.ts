import { defineStore } from 'pinia'

export interface LocationMembership {
  id: string
  name: string
  timezone: string
  address: string | null
  role: string
  membershipStatus: string
  createdAt: string
  updatedAt: string
}

interface LocationState {
  memberships: LocationMembership[]
  activeLocationId: string | null
  loaded: boolean
}

export const useLocationStore = defineStore('location', {
  state: (): LocationState => ({
    memberships: [],
    activeLocationId: null,
    loaded: false
  }),
  getters: {
    activeLocation: (state) =>
      state.memberships.find((membership) => membership.id === state.activeLocationId) ?? null
  },
  actions: {
    restoreActiveLocation() {
      if (!import.meta.client && typeof localStorage === 'undefined') {
        return
      }

      const value = localStorage.getItem('jtrack.activeLocationId')
      this.activeLocationId = value
    },

    setActiveLocation(locationId: string | null) {
      const previousLocationId = this.activeLocationId
      this.activeLocationId = locationId

      if (import.meta.client || typeof localStorage !== 'undefined') {
        if (locationId) {
          localStorage.setItem('jtrack.activeLocationId', locationId)
        } else {
          localStorage.removeItem('jtrack.activeLocationId')
        }
      }

      if (previousLocationId !== locationId) {
        void this.cleanupLocationScopedData(locationId).catch((error) => {
          console.warn('[location] failed to cleanup location-scoped data', error)
        })
      }
    },

    async loadLocations() {
      const api = useApiClient()
      const locations = await api.get<LocationMembership[]>('/locations')
      this.memberships = locations
      this.loaded = true

      if (this.activeLocationId && !locations.find((location) => location.id === this.activeLocationId)) {
        this.setActiveLocation(locations[0]?.id ?? null)
      }

      if (!this.activeLocationId && locations.length > 0) {
        this.setActiveLocation(locations[0].id)
      }

      return locations
    },

    clear() {
      this.memberships = []
      this.loaded = false
      this.setActiveLocation(null)
    },

    async cleanupLocationScopedData(locationId: string | null) {
      if (!import.meta.client && typeof window === 'undefined') {
        return
      }

      let db: any
      try {
        db = useRxdb()
      } catch {
        return
      }

      const removeBySelector = async (collection: any, selector?: Record<string, unknown>) => {
        const query = selector ? collection.find({ selector }) : collection.find()
        const docs = await query.exec()

        if (docs.length === 0) {
          return
        }

        const ids = docs
          .map((doc: any) => {
            if (typeof doc.primary === 'string') {
              return doc.primary
            }

            const json = typeof doc.toJSON === 'function' ? doc.toJSON() : null
            return typeof json?.id === 'string' ? json.id : null
          })
          .filter((id: string | null): id is string => id !== null)

        if (ids.length > 0 && typeof collection.bulkRemove === 'function') {
          await collection.bulkRemove(ids)
          return
        }

        await Promise.all(docs.map((doc: any) => doc.remove()))
      }

      const locationScopedCollections = [
        db.collections.tickets,
        db.collections.ticketComments,
        db.collections.ticketAttachments,
        db.collections.paymentRecords,
        db.collections.outbox,
        db.collections.pendingAttachmentUploads
      ].filter(Boolean)

      await Promise.all(
        locationScopedCollections.map((collection: any) =>
          removeBySelector(collection, locationId ? { locationId: { $ne: locationId } } : undefined)
        )
      )

      await removeBySelector(
        db.collections.syncState,
        locationId ? { id: { $ne: `sync:${locationId}` } } : undefined
      )
    }
  }
})
