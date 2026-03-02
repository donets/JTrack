import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDispatchAccessGuard } from './useDispatchAccessGuard'

const ownerUser = {
  id: 'user-owner',
  email: 'owner@demo.local',
  name: 'Owner',
  isAdmin: false,
  createdAt: '2026-03-02T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z'
}

type AuthStoreLike = {
  user: typeof ownerUser | null
  offlineSession: boolean
  isAuthenticated: boolean
  restoreState: () => void
}

type LocationStoreLike = {
  activeLocationId: string | null
  loaded: boolean
  restoreActiveLocation: () => void
  restoreCachedMemberships: () => boolean
  loadLocations: () => Promise<unknown>
}

type TestContext = {
  authStore: AuthStoreLike
  locationStore: LocationStoreLike
  hasPrivilege: () => boolean
  show: ReturnType<typeof vi.fn>
  navigateTo: ReturnType<typeof vi.fn>
}

const setOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: online
  })
}

const setupContext = (context: TestContext) => {
  vi.stubGlobal('useAuthStore', () => context.authStore)
  vi.stubGlobal('useLocationStore', () => context.locationStore)
  vi.stubGlobal('useRbacGuard', () => ({ hasPrivilege: context.hasPrivilege }))
  vi.stubGlobal('useToast', () => ({ show: context.show }))
  vi.stubGlobal('navigateTo', context.navigateTo)
}

describe('useDispatchAccessGuard', () => {
  beforeEach(() => {
    setOnline(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('restores auth snapshot and offline memberships before denying access', async () => {
    setOnline(false)
    const canManageDispatch = ref(false)

    const authStore: AuthStoreLike = {
      user: null,
      offlineSession: false,
      isAuthenticated: false,
      restoreState: vi.fn(() => {
        authStore.user = ownerUser
        authStore.offlineSession = true
      })
    }

    const locationStore: LocationStoreLike = {
      activeLocationId: null,
      loaded: false,
      restoreActiveLocation: vi.fn(() => {
        locationStore.activeLocationId = 'loc-1'
      }),
      restoreCachedMemberships: vi.fn(() => {
        locationStore.loaded = true
        canManageDispatch.value = true
        return true
      }),
      loadLocations: vi.fn(async () => [])
    }

    const show = vi.fn()
    const navigateTo = vi.fn(async () => undefined)
    const hasPrivilege = vi.fn(() => canManageDispatch.value)

    setupContext({ authStore, locationStore, hasPrivilege, show, navigateTo })

    const guard = useDispatchAccessGuard()
    await expect(guard.enforceDispatchAccess()).resolves.toBe(true)

    expect(authStore.restoreState).toHaveBeenCalledTimes(1)
    expect(locationStore.restoreActiveLocation).toHaveBeenCalledTimes(1)
    expect(locationStore.restoreCachedMemberships).toHaveBeenCalledTimes(1)
    expect(locationStore.loadLocations).not.toHaveBeenCalled()
    expect(show).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('loads locations online for authenticated session before deny check', async () => {
    setOnline(true)
    const canManageDispatch = ref(false)

    const authStore: AuthStoreLike = {
      user: ownerUser,
      offlineSession: false,
      isAuthenticated: true,
      restoreState: vi.fn()
    }

    const locationStore: LocationStoreLike = {
      activeLocationId: 'loc-1',
      loaded: false,
      restoreActiveLocation: vi.fn(),
      restoreCachedMemberships: vi.fn(() => false),
      loadLocations: vi.fn(async () => {
        locationStore.loaded = true
        canManageDispatch.value = true
        return []
      })
    }

    const show = vi.fn()
    const navigateTo = vi.fn(async () => undefined)
    const hasPrivilege = vi.fn(() => canManageDispatch.value)

    setupContext({ authStore, locationStore, hasPrivilege, show, navigateTo })

    const guard = useDispatchAccessGuard()
    await expect(guard.enforceDispatchAccess()).resolves.toBe(true)

    expect(locationStore.loadLocations).toHaveBeenCalledTimes(1)
    expect(locationStore.restoreCachedMemberships).not.toHaveBeenCalled()
    expect(show).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('shows warning and redirects when privilege is still missing after hydration', async () => {
    setOnline(false)

    const authStore: AuthStoreLike = {
      user: ownerUser,
      offlineSession: true,
      isAuthenticated: false,
      restoreState: vi.fn()
    }

    const locationStore: LocationStoreLike = {
      activeLocationId: 'loc-1',
      loaded: true,
      restoreActiveLocation: vi.fn(),
      restoreCachedMemberships: vi.fn(() => true),
      loadLocations: vi.fn(async () => [])
    }

    const show = vi.fn()
    const navigateTo = vi.fn(async () => undefined)
    const hasPrivilege = vi.fn(() => false)

    setupContext({ authStore, locationStore, hasPrivilege, show, navigateTo })

    const guard = useDispatchAccessGuard()
    await expect(guard.enforceDispatchAccess()).resolves.toBe(false)

    expect(show).toHaveBeenCalledWith({
      type: 'warning',
      message: 'You do not have permission to access Dispatch.'
    })
    expect(navigateTo).toHaveBeenCalledWith('/dashboard')
  })
})
