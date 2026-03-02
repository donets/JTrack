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

const canUseClientStorage = import.meta.client || import.meta.env.MODE === 'test'
const ACTIVE_LOCATION_STORAGE_KEY = 'jtrack.activeLocationId'
const LOCATION_MEMBERSHIPS_STORAGE_KEY = 'jtrack.locationMemberships'

const isLocationMembership = (value: unknown): value is LocationMembership => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.timezone === 'string' &&
    (typeof item.address === 'string' || item.address === null) &&
    typeof item.role === 'string' &&
    typeof item.membershipStatus === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  )
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
      if (!canUseClientStorage) {
        return
      }

      const value = localStorage.getItem(ACTIVE_LOCATION_STORAGE_KEY)
      this.activeLocationId = value
    },

    restoreCachedMemberships() {
      if (!canUseClientStorage) {
        return false
      }

      const raw = localStorage.getItem(LOCATION_MEMBERSHIPS_STORAGE_KEY)
      if (!raw) {
        return false
      }

      try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
          localStorage.removeItem(LOCATION_MEMBERSHIPS_STORAGE_KEY)
          return false
        }

        const memberships = parsed.filter(isLocationMembership)
        if (memberships.length === 0) {
          localStorage.removeItem(LOCATION_MEMBERSHIPS_STORAGE_KEY)
          return false
        }

        this.memberships = memberships
        this.loaded = true

        if (this.activeLocationId && memberships.some((location) => location.id === this.activeLocationId)) {
          return true
        }

        const fallbackLocationId = memberships[0].id
        this.activeLocationId = fallbackLocationId
        localStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, fallbackLocationId)
        return true
      } catch {
        localStorage.removeItem(LOCATION_MEMBERSHIPS_STORAGE_KEY)
        return false
      }
    },

    setActiveLocation(locationId: string | null) {
      const previousLocationId = this.activeLocationId
      this.activeLocationId = locationId

      if (canUseClientStorage) {
        if (locationId) {
          localStorage.setItem(ACTIVE_LOCATION_STORAGE_KEY, locationId)
        } else {
          localStorage.removeItem(ACTIVE_LOCATION_STORAGE_KEY)
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

      if (canUseClientStorage) {
        localStorage.setItem(LOCATION_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(locations))
      }

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

      if (canUseClientStorage) {
        localStorage.removeItem(LOCATION_MEMBERSHIPS_STORAGE_KEY)
      }
    },

    async cleanupLocationScopedData(locationId: string | null) {
      if (!canUseClientStorage) {
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
        db.collections.ticketActivities,
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
