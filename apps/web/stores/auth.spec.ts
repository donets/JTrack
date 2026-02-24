import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        apiBase: 'http://localhost:3001'
      }
    }))
    vi.stubGlobal('$fetch', vi.fn())
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
    fetchMock.mockRejectedValue(new Error('unauthorized'))

    await expect(store.refreshAccessToken()).resolves.toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('jtrack.auth')).toBeNull()
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
})
