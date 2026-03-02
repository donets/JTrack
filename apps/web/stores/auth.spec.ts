import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth'

const demoUser = {
  id: 'user-1',
  email: 'tech@jtrack.local',
  name: 'Tech',
  isAdmin: false,
  createdAt: '2026-02-24T09:00:00.000Z',
  updatedAt: '2026-02-24T09:00:00.000Z'
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true
    })
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        apiBase: 'http://localhost:3001'
      }
    }))
    vi.stubGlobal('$fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('login stores token and persists user snapshot', async () => {
    const store = useAuthStore()
    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockResolvedValue({
      accessToken: 'access-1',
      user: demoUser
    })

    await store.login('tech@jtrack.local', 'password123')

    expect(store.accessToken).toBe('access-1')
    expect(store.user).toEqual(demoUser)
    expect(fetchMock).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: {
          email: 'tech@jtrack.local',
          password: 'password123'
        }
      })
    )
  })

  it('refreshAccessToken clears state on failure', async () => {
    const store = useAuthStore()
    store.accessToken = 'access-old'
    store.user = demoUser
    store.persistState()

    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockRejectedValue({
      statusCode: 401,
      message: 'Unauthorized'
    })

    await expect(store.refreshAccessToken()).resolves.toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.offlineSession).toBe(false)
    expect(localStorage.getItem('jtrack.auth')).toBeNull()
  })

  it('refreshAccessToken keeps cached user on network failure even when navigator.onLine=true', async () => {
    const store = useAuthStore()
    store.user = demoUser
    store.persistState()

    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(store.refreshAccessToken()).resolves.toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.user).toEqual(demoUser)
    expect(store.offlineSession).toBe(true)
  })

  it('fetchMe sends bearer token and updates current user', async () => {
    const store = useAuthStore()
    store.accessToken = 'access-2'

    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockResolvedValue({
      ...demoUser,
      name: 'Updated Tech'
    })

    const me = await store.fetchMe()

    expect(me?.name).toBe('Updated Tech')
    expect(store.user?.name).toBe('Updated Tech')
    expect(fetchMock).toHaveBeenCalledWith(
      '/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: {
          authorization: 'Bearer access-2'
        }
      })
    )
  })

  it('bootstrap tries refresh when no access token exists', async () => {
    const store = useAuthStore()
    const refreshSpy = vi.spyOn(store, 'refreshAccessToken').mockResolvedValue(true)

    await store.bootstrap()

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(store.bootstrapped).toBe(true)
  })

  it('refreshAccessToken deduplicates concurrent requests', async () => {
    const store = useAuthStore()
    let resolveFetch!: (value: unknown) => void
    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as (value: unknown) => void
        }) as never
    )

    const first = store.refreshAccessToken()
    const second = store.refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveFetch({
      accessToken: 'access-3',
      user: demoUser
    })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(store.accessToken).toBe('access-3')
  })

  it('bootstrap clears persisted user before refresh completes', async () => {
    const store = useAuthStore()
    localStorage.setItem(
      'jtrack.auth',
      JSON.stringify({
        user: demoUser
      })
    )

    let resolveFetch!: (value: unknown) => void
    const fetchMock = vi.mocked(globalThis.$fetch)
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as (value: unknown) => void
        }) as never
    )

    const bootstrapPromise = store.bootstrap()

    expect(store.user).toBeNull()
    expect(store.bootstrapped).toBe(false)

    resolveFetch({
      accessToken: 'access-4',
      user: demoUser
    })

    await bootstrapPromise

    expect(store.bootstrapped).toBe(true)
    expect(store.user).toEqual(demoUser)
  })

  it('bootstrap keeps persisted user snapshot while offline', async () => {
    const store = useAuthStore()
    store.user = demoUser
    store.persistState()
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    })

    const fetchMock = vi.mocked(globalThis.$fetch)

    await store.bootstrap()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(store.bootstrapped).toBe(true)
    expect(store.accessToken).toBeNull()
    expect(store.user).toEqual(demoUser)
    expect(store.offlineSession).toBe(true)
  })

  it('falls back to offline login path when network login fails offline', async () => {
    const store = useAuthStore()
    const fetchMock = vi.mocked(globalThis.$fetch)
    const offlineSpy = vi.spyOn(store, 'tryOfflineLogin').mockResolvedValueOnce(true)
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    })

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(store.login('tech@jtrack.local', 'password123')).resolves.toBeUndefined()
    expect(offlineSpy).toHaveBeenCalledWith('tech@jtrack.local', 'password123', undefined)
  })

  it('falls back to forced offline login when network login fails but navigator.onLine=true', async () => {
    const store = useAuthStore()
    const fetchMock = vi.mocked(globalThis.$fetch)
    const offlineSpy = vi.spyOn(store, 'tryOfflineLogin').mockResolvedValueOnce(true)

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(store.login('tech@jtrack.local', 'password123')).resolves.toBeUndefined()
    expect(offlineSpy).toHaveBeenCalledWith('tech@jtrack.local', 'password123', { force: true })
  })

  it('rethrows login error when offline fallback fails', async () => {
    const store = useAuthStore()
    const fetchMock = vi.mocked(globalThis.$fetch)
    const offlineSpy = vi.spyOn(store, 'tryOfflineLogin').mockResolvedValueOnce(false)

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    })

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(store.login('tech@jtrack.local', 'wrong-password')).rejects.toThrow(TypeError)
    expect(offlineSpy).toHaveBeenCalledWith('tech@jtrack.local', 'wrong-password', undefined)
    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it('clearState removes offline login snapshot', () => {
    const store = useAuthStore()
    localStorage.setItem(
      'jtrack.offlineLogin',
      JSON.stringify({
        email: 'tech@jtrack.local',
        salt: 'salt',
        verifier: 'verifier',
        user: demoUser,
        updatedAt: '2026-03-02T00:00:00.000Z'
      })
    )

    store.user = demoUser
    store.accessToken = 'access-1'
    store.clearState()

    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('jtrack.offlineLogin')).toBeNull()
  })
})
