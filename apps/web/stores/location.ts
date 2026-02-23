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
      if (!import.meta.client) {
        return
      }

      const value = localStorage.getItem('jtrack.activeLocationId')
      this.activeLocationId = value
    },

    setActiveLocation(locationId: string | null) {
      this.activeLocationId = locationId

      if (import.meta.client) {
        if (locationId) {
          localStorage.setItem('jtrack.activeLocationId', locationId)
        } else {
          localStorage.removeItem('jtrack.activeLocationId')
        }
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
    }
  }
})
