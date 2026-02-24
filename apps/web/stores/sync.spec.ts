import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth'
import { useLocationStore } from './location'
import { useSyncStore } from './sync'

const createEmptyChanges = () => ({
  tickets: { created: [], updated: [], deleted: [] },
  ticketComments: { created: [], updated: [], deleted: [] },
  ticketAttachments: { created: [], updated: [], deleted: [] },
  paymentRecords: { created: [], updated: [], deleted: [] }
})

const createCollectionMock = () => ({
  upsert: vi.fn(),
  findOne: vi.fn(() => ({
    exec: vi.fn(async () => null)
  }))
})

describe('sync store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()

    const uuid = '00000000-0000-4000-8000-000000000001' as `${string}-${string}-${string}-${string}-${string}`

    if (!globalThis.crypto) {
      vi.stubGlobal('crypto', {
        randomUUID: () => uuid
      })
    } else {
      vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid)
    }

    vi.stubGlobal('useAuthStore', useAuthStore)
    vi.stubGlobal('useLocationStore', useLocationStore)
    vi.stubGlobal('useApiClient', () => ({
      post: vi.fn()
    }))
    vi.stubGlobal('useRxdb', () => ({
      collections: {
        syncState: {
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => null)
          })),
          insert: vi.fn()
        },
        outbox: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [])
          }))
        },
        tickets: createCollectionMock(),
        ticketComments: createCollectionMock(),
        ticketAttachments: createCollectionMock(),
        paymentRecords: createCollectionMock()
      }
    }))
  })

  it('syncNow exits early when user is not authenticated or location is missing', async () => {
    const authStore = useAuthStore()
    const locationStore = useLocationStore()
    const syncStore = useSyncStore()

    locationStore.activeLocationId = 'loc-1'
    await syncStore.syncNow()

    expect(syncStore.syncing).toBe(false)

    authStore.accessToken = 'access-1'
    locationStore.activeLocationId = null
    await syncStore.syncNow()

    expect(syncStore.syncing).toBe(false)
  })

  it('syncNow captures validation errors from malformed sync responses', async () => {
    const authStore = useAuthStore()
    const locationStore = useLocationStore()
    const syncStore = useSyncStore()

    authStore.accessToken = 'access-1'
    locationStore.activeLocationId = 'loc-1'
    vi.stubGlobal('useApiClient', () => ({
      post: vi.fn(async () => undefined)
    }))

    await syncStore.syncNow()

    expect(syncStore.error).toContain('invalid_type')
    expect(syncStore.syncing).toBe(false)
  })

  it('syncNow pushes outbox, pulls remote changes, and updates sync checkpoint', async () => {
    const authStore = useAuthStore()
    const locationStore = useLocationStore()
    const syncStore = useSyncStore()
    authStore.accessToken = 'access-1'
    locationStore.activeLocationId = 'loc-1'

    const post = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        newTimestamp: 1_700_000_001_000
      })
      .mockResolvedValueOnce({
        changes: createEmptyChanges(),
        timestamp: 1_700_000_002_000
      })
    vi.stubGlobal('useApiClient', () => ({ post }))

    const syncStateDoc = {
      toJSON: () => ({
        lastPulledAt: 1_700_000_000_000
      }),
      incrementalPatch: vi.fn()
    }

    const firstOutboxRemove = vi.fn()
    const secondOutboxRemove = vi.fn()

    const db = {
      collections: {
        syncState: {
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => syncStateDoc)
          })),
          insert: vi.fn()
        },
        outbox: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  entity: 'tickets',
                  operation: 'create',
                  payload: { id: 'ticket-1', title: 'Created' },
                  createdAt: 1
                }),
                remove: firstOutboxRemove
              },
              {
                toJSON: () => ({
                  entity: 'tickets',
                  operation: 'delete',
                  payload: { id: 'ticket-2' },
                  createdAt: 2
                }),
                remove: secondOutboxRemove
              }
            ])
          }))
        },
        tickets: createCollectionMock(),
        ticketComments: createCollectionMock(),
        ticketAttachments: createCollectionMock(),
        paymentRecords: createCollectionMock()
      }
    }
    vi.stubGlobal('useRxdb', () => db)

    await syncStore.syncNow()

    expect(post).toHaveBeenNthCalledWith(
      1,
      '/sync/push',
      expect.objectContaining({
        locationId: 'loc-1',
        lastPulledAt: 1_700_000_000_000,
        clientId: syncStore.clientId
      })
    )
    expect(post).toHaveBeenNthCalledWith(2, '/sync/pull', {
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      limit: 100,
      cursor: null
    })
    expect(firstOutboxRemove).toHaveBeenCalledTimes(1)
    expect(secondOutboxRemove).toHaveBeenCalledTimes(1)
    expect(syncStateDoc.incrementalPatch).toHaveBeenCalledWith({
      lastPulledAt: 1_700_000_002_000,
      updatedAt: expect.any(Number)
    })
    expect(syncStore.lastSyncedAt).toBe(1_700_000_002_000)
    expect(syncStore.error).toBeNull()
    expect(syncStore.syncing).toBe(false)
  })

  it('syncNow paginates pull requests until hasMore becomes false', async () => {
    const authStore = useAuthStore()
    const locationStore = useLocationStore()
    const syncStore = useSyncStore()
    authStore.accessToken = 'access-1'
    locationStore.activeLocationId = 'loc-1'

    const paginationCursor = {
      snapshotAt: 1_700_000_003_000,
      ticketsOffset: 1,
      ticketCommentsOffset: 0,
      ticketAttachmentsOffset: 0,
      paymentRecordsOffset: 0
    }

    const post = vi
      .fn()
      .mockResolvedValueOnce({
        changes: {
          ...createEmptyChanges(),
          tickets: {
            created: [
              {
                id: 'ticket-1',
                locationId: 'loc-1',
                createdByUserId: 'user-1',
                assignedToUserId: null,
                title: 'Created',
                description: null,
                status: 'New',
                scheduledStartAt: null,
                scheduledEndAt: null,
                priority: null,
                totalAmountCents: null,
                currency: 'EUR',
                createdAt: '2026-02-24T12:00:00.000Z',
                updatedAt: '2026-02-24T12:00:00.000Z',
                deletedAt: null
              }
            ],
            updated: [],
            deleted: []
          }
        },
        timestamp: 1_700_000_003_000,
        hasMore: true,
        nextCursor: paginationCursor
      })
      .mockResolvedValueOnce({
        changes: {
          ...createEmptyChanges(),
          tickets: {
            created: [
              {
                id: 'ticket-2',
                locationId: 'loc-1',
                createdByUserId: 'user-1',
                assignedToUserId: null,
                title: 'Created second page',
                description: null,
                status: 'New',
                scheduledStartAt: null,
                scheduledEndAt: null,
                priority: null,
                totalAmountCents: null,
                currency: 'EUR',
                createdAt: '2026-02-24T12:05:00.000Z',
                updatedAt: '2026-02-24T12:05:00.000Z',
                deletedAt: null
              }
            ],
            updated: [],
            deleted: []
          }
        },
        timestamp: 1_700_000_003_000,
        hasMore: false,
        nextCursor: null
      })
    vi.stubGlobal('useApiClient', () => ({ post }))

    const syncStateDoc = {
      toJSON: () => ({
        lastPulledAt: 1_700_000_000_000
      }),
      incrementalPatch: vi.fn()
    }

    const ticketsCollection = createCollectionMock()

    vi.stubGlobal('useRxdb', () => ({
      collections: {
        syncState: {
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => syncStateDoc)
          })),
          insert: vi.fn()
        },
        outbox: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [])
          }))
        },
        tickets: ticketsCollection,
        ticketComments: createCollectionMock(),
        ticketAttachments: createCollectionMock(),
        paymentRecords: createCollectionMock()
      }
    }))

    await syncStore.syncNow()

    expect(post).toHaveBeenNthCalledWith(1, '/sync/pull', {
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      limit: 100,
      cursor: null
    })
    expect(post).toHaveBeenNthCalledWith(2, '/sync/pull', {
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      limit: 100,
      cursor: paginationCursor
    })
    expect(ticketsCollection.upsert).toHaveBeenCalledTimes(2)
    expect(syncStateDoc.incrementalPatch).toHaveBeenCalledWith({
      lastPulledAt: 1_700_000_003_000,
      updatedAt: expect.any(Number)
    })
  })

  it('applyEntityChanges soft-deletes docs with deletedAt and hard-removes others', async () => {
    const syncStore = useSyncStore()
    const softDeleteDoc = {
      toJSON: () => ({ id: 'ticket-1', deletedAt: null }),
      incrementalPatch: vi.fn(),
      remove: vi.fn()
    }
    const hardDeleteDoc = {
      toJSON: () => ({ id: 'payment-1' }),
      incrementalPatch: vi.fn(),
      remove: vi.fn()
    }

    const db = {
      collections: {
        tickets: {
          upsert: vi.fn(),
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => softDeleteDoc)
          }))
        },
        paymentRecords: {
          upsert: vi.fn(),
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => hardDeleteDoc)
          }))
        }
      }
    }

    await syncStore.applyEntityChanges(db, 'tickets', {
      created: [],
      updated: [],
      deleted: ['ticket-1']
    })
    await syncStore.applyEntityChanges(db, 'paymentRecords', {
      created: [],
      updated: [],
      deleted: ['payment-1']
    })

    expect(softDeleteDoc.incrementalPatch).toHaveBeenCalledWith({
      deletedAt: expect.any(String)
    })
    expect(hardDeleteDoc.remove).toHaveBeenCalledTimes(1)
  })
})
