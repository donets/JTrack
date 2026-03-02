import { defineStore } from 'pinia'
import type { User } from '@jtrack/shared'

let refreshPromise: Promise<boolean> | null = null
let bootstrapPromise: Promise<void> | null = null

const AUTH_STORAGE_KEY = 'jtrack.auth'
const OFFLINE_LOGIN_STORAGE_KEY = 'jtrack.offlineLogin'
const OFFLINE_LOGIN_SALT_BYTES = 16
const OFFLINE_LOGIN_DERIVE_BITS = 256
const OFFLINE_LOGIN_ITERATIONS = 120_000

const isClientOffline = () => typeof window !== 'undefined' && navigator.onLine === false
const normalizeEmail = (email: string) => email.trim().toLowerCase()

interface OfflineLoginSnapshot {
  email: string
  salt: string
  verifier: string
  user: User
  updatedAt: string
}

const encodeBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (const value of bytes) {
    binary += String.fromCharCode(value)
  }
  return btoa(binary)
}

const decodeBase64 = (value: string) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const getCrypto = () => (typeof globalThis !== 'undefined' ? globalThis.crypto ?? null : null)

const canUseOfflineCrypto = () => {
  const cryptoApi = getCrypto()
  return Boolean(cryptoApi?.subtle && typeof cryptoApi.getRandomValues === 'function')
}

const createSalt = () => {
  const cryptoApi = getCrypto()
  if (!cryptoApi?.getRandomValues) {
    return null
  }

  const salt = new Uint8Array(OFFLINE_LOGIN_SALT_BYTES)
  cryptoApi.getRandomValues(salt)
  return encodeBase64(salt)
}

const deriveOfflineVerifier = async (email: string, password: string, saltBase64: string) => {
  const cryptoApi = getCrypto()
  if (!cryptoApi?.subtle) {
    return null
  }

  try {
    const passwordKey = await cryptoApi.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )

    const bits = await cryptoApi.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: decodeBase64(saltBase64),
        iterations: OFFLINE_LOGIN_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      OFFLINE_LOGIN_DERIVE_BITS
    )

    const digest = new Uint8Array(bits)
    const normalizedEmail = normalizeEmail(email)
    const emailBytes = new TextEncoder().encode(normalizedEmail)
    if (emailBytes.length > 0) {
      for (let index = 0; index < digest.length; index += 1) {
        digest[index] ^= emailBytes[index % emailBytes.length] ?? 0
      }
    }

    return encodeBase64(digest)
  } catch {
    return null
  }
}

const isValidOfflineSnapshot = (value: unknown): value is OfflineLoginSnapshot => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Record<string, unknown>
  const user = snapshot.user as Record<string, unknown> | undefined
  return (
    typeof snapshot.email === 'string' &&
    typeof snapshot.salt === 'string' &&
    typeof snapshot.verifier === 'string' &&
    typeof snapshot.updatedAt === 'string' &&
    Boolean(user) &&
    typeof user?.id === 'string' &&
    typeof user?.email === 'string' &&
    typeof user?.name === 'string' &&
    typeof user?.isAdmin === 'boolean'
  )
}

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
      try {
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
        await this.persistOfflineLoginSnapshot(email, password, result.user)
        return
      } catch (error) {
        const offlineLoggedIn = await this.tryOfflineLogin(email, password)
        if (offlineLoggedIn) {
          return
        }

        throw error
      }
    },

    async persistOfflineLoginSnapshot(email: string, password: string, user: User) {
      if (!import.meta.client || !canUseOfflineCrypto()) {
        return
      }

      const salt = createSalt()
      if (!salt) {
        return
      }

      const verifier = await deriveOfflineVerifier(email, password, salt)
      if (!verifier) {
        return
      }

      const snapshot: OfflineLoginSnapshot = {
        email: normalizeEmail(email),
        salt,
        verifier,
        user,
        updatedAt: new Date().toISOString()
      }

      localStorage.setItem(OFFLINE_LOGIN_STORAGE_KEY, JSON.stringify(snapshot))
    },

    readOfflineLoginSnapshot() {
      if (!import.meta.client) {
        return null
      }

      const raw = localStorage.getItem(OFFLINE_LOGIN_STORAGE_KEY)
      if (!raw) {
        return null
      }

      try {
        const parsed = JSON.parse(raw) as unknown
        if (!isValidOfflineSnapshot(parsed)) {
          localStorage.removeItem(OFFLINE_LOGIN_STORAGE_KEY)
          return null
        }

        return parsed
      } catch {
        localStorage.removeItem(OFFLINE_LOGIN_STORAGE_KEY)
        return null
      }
    },

    async tryOfflineLogin(email: string, password: string) {
      if (!import.meta.client || !isClientOffline() || !canUseOfflineCrypto()) {
        return false
      }

      const snapshot = this.readOfflineLoginSnapshot()
      if (!snapshot || snapshot.email !== normalizeEmail(email)) {
        return false
      }

      const verifier = await deriveOfflineVerifier(email, password, snapshot.salt)
      if (!verifier || verifier !== snapshot.verifier) {
        return false
      }

      this.accessToken = null
      this.user = snapshot.user
      this.persistState()
      return true
    },

    async refreshAccessToken() {
      if (refreshPromise) {
        return refreshPromise
      }

      const config = useRuntimeConfig()

      refreshPromise = (async () => {
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
          this.accessToken = null
          if (!isClientOffline()) {
            this.clearState()
          }
          return false
        }
      })().finally(() => {
        refreshPromise = null
      })

      return refreshPromise
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
        if (isClientOffline()) {
          return this.user
        }
        this.clearState()
        return null
      }
    },

    async bootstrap() {
      if (this.bootstrapped) {
        return
      }

      if (bootstrapPromise) {
        await bootstrapPromise
        return
      }

      bootstrapPromise = (async () => {
        this.restoreState()
        const offline = isClientOffline()

        // Never trust a persisted user snapshot before session is revalidated.
        if (!this.accessToken && !offline) {
          this.user = null
        }

        if (offline) {
          this.bootstrapped = true
          return
        }

        if (this.accessToken) {
          const me = await this.fetchMe()

          if (!me) {
            await this.refreshAccessToken()
          }
        } else {
          await this.refreshAccessToken()
        }

        this.bootstrapped = true
      })().finally(() => {
        bootstrapPromise = null
      })

      await bootstrapPromise
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

      const raw = localStorage.getItem(AUTH_STORAGE_KEY)

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
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: this.user
        })
      )
    },

    clearState() {
      this.accessToken = null
      this.user = null

      if (import.meta.client) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }
})
