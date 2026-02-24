import { defineStore } from 'pinia'
import type { User } from '@jtrack/shared'

interface AuthState {
  accessToken: string | null
  user: User | null
  bootstrapped: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    user: null,
    bootstrapped: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken)
  },
  actions: {
    async login(email: string, password: string) {
      const config = useRuntimeConfig()
      const result = await $fetch<{ accessToken: string; user: User }>('/auth/login', {
        baseURL: config.public.apiBase,
        method: 'POST',
        credentials: 'include',
        body: {
          email,
          password
        }
      })

      this.accessToken = result.accessToken
      this.user = result.user
      this.persistState()
    },

    async refreshAccessToken() {
      const config = useRuntimeConfig()

      try {
        const result = await $fetch<{ accessToken: string; user: User }>('/auth/refresh', {
          baseURL: config.public.apiBase,
          method: 'POST',
          credentials: 'include',
          body: {}
        })

        this.accessToken = result.accessToken
        this.user = result.user
        this.persistState()

        return true
      } catch {
        this.clearState()
        return false
      }
    },

    async fetchMe() {
      if (!this.accessToken) {
        return null
      }

      const config = useRuntimeConfig()

      try {
        const user = await $fetch<User>('/auth/me', {
          baseURL: config.public.apiBase,
          method: 'GET',
          credentials: 'include',
          headers: {
            authorization: `Bearer ${this.accessToken}`
          }
        })

        this.user = user
        this.persistState()
        return user
      } catch {
        this.clearState()
        return null
      }
    },

    async bootstrap() {
      if (this.bootstrapped) {
        return
      }

      this.restoreState()

      if (this.accessToken) {
        const me = await this.fetchMe()

        if (!me) {
          await this.refreshAccessToken()
        }
      } else {
        await this.refreshAccessToken()
      }

      this.bootstrapped = true
    },

    async logout() {
      if (this.accessToken) {
        const config = useRuntimeConfig()

        try {
          await $fetch('/auth/logout', {
            baseURL: config.public.apiBase,
            method: 'POST',
            credentials: 'include',
            headers: {
              authorization: `Bearer ${this.accessToken}`
            }
          })
        } catch {
          // Ignore logout API failures and continue local cleanup
        }
      }

      this.clearState()
    },

    restoreState() {
      if (!import.meta.client) {
        return
      }

      const raw = localStorage.getItem('jtrack.auth')

      if (!raw) {
        return
      }

      try {
        const parsed = JSON.parse(raw) as { user: User | null }
        this.user = parsed.user
      } catch {
        this.clearState()
      }
    },

    persistState() {
      if (!import.meta.client) {
        return
      }

      localStorage.setItem(
        'jtrack.auth',
        JSON.stringify({
          user: this.user
        })
      )
    },

    clearState() {
      this.accessToken = null
      this.user = null

      if (import.meta.client) {
        localStorage.removeItem('jtrack.auth')
      }
    }
  }
})
