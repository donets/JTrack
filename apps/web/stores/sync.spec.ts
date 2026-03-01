import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth'
import { useLocationStore } from './location'
import { useSyncStore } from './sync'

const createEmptyChanges = () => ({
  tickets: { created: [], updated: [], deleted: [] },
  ticketActivities: { created: [], updated: [], deleted: [] },
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
        ticketActivities: createCollectionMock(),
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
        ticketActivities: createCollectionMock(),
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
      ticketActivitiesOffset: 0,
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
        ticketActivities: createCollectionMock(),
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

  it('syncNow filters echoed upserts when updatedAt equals push timestamp', async () => {
    const authStore = useAuthStore()
    const locationStore = useLocationStore()
    const syncStore = useSyncStore()
    authStore.accessToken = 'access-1'
    locationStore.activeLocationId = 'loc-1'

    const pushTimestamp = 1_700_000_001_000
    const post = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        newTimestamp: pushTimestamp
      })
      .mockResolvedValueOnce({
        changes: {
          ...createEmptyChanges(),
          tickets: {
            created: [
              {
                id: 'ticket-echo',
                locationId: 'loc-1',
                createdByUserId: 'user-1',
                assignedToUserId: null,
                title: 'Echo',
                description: null,
                status: 'New',
                scheduledStartAt: null,
                scheduledEndAt: null,
                priority: null,
                totalAmountCents: null,
                currency: 'EUR',
                createdAt: '2026-02-24T12:00:00.000Z',
                updatedAt: '2023-11-14T22:13:21.000Z',
                deletedAt: null
              },
              {
                id: 'ticket-remote',
                locationId: 'loc-1',
                createdByUserId: 'user-2',
                assignedToUserId: null,
                title: 'Remote',
                description: null,
                status: 'New',
                scheduledStartAt: null,
                scheduledEndAt: null,
                priority: null,
                totalAmountCents: null,
                currency: 'EUR',
                createdAt: '2026-02-24T12:01:00.000Z',
                updatedAt: '2026-02-24T12:01:00.000Z',
                deletedAt: null
              }
            ],
            updated: [],
            deleted: []
          }
        },
        timestamp: 1_700_000_002_000,
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

    const removeOutbox = vi.fn()
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
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  entity: 'tickets',
                  operation: 'create',
                  payload: { id: 'ticket-echo' },
                  createdAt: 1
                }),
                remove: removeOutbox
              }
            ])
          }))
        },
        tickets: ticketsCollection,
        ticketActivities: createCollectionMock(),
        ticketComments: createCollectionMock(),
        ticketAttachments: createCollectionMock(),
        paymentRecords: createCollectionMock()
      }
    }))

    await syncStore.syncNow()

    expect(post).toHaveBeenNthCalledWith(2, '/sync/pull', {
      locationId: 'loc-1',
      lastPulledAt: 1_700_000_000_000,
      limit: 100,
      cursor: null
    })
    expect(removeOutbox).toHaveBeenCalledTimes(1)
    expect(ticketsCollection.upsert).toHaveBeenCalledTimes(1)
    expect(ticketsCollection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ticket-remote' })
    )
  })

  it('syncNow suppresses echoed deletes from pull response after push', async () => {
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
        changes: {
          ...createEmptyChanges(),
          tickets: {
            created: [],
            updated: [],
            deleted: ['ticket-echo-delete', 'ticket-remote-delete']
          }
        },
        timestamp: 1_700_000_002_000,
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

    const removeOutbox = vi.fn()
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
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  entity: 'tickets',
                  operation: 'delete',
                  payload: { id: 'ticket-echo-delete' },
                  createdAt: 1
                }),
                remove: removeOutbox
              }
            ])
          }))
        },
        tickets: ticketsCollection,
        ticketActivities: createCollectionMock(),
        ticketComments: createCollectionMock(),
        ticketAttachments: createCollectionMock(),
        paymentRecords: createCollectionMock()
      }
    }))

    await syncStore.syncNow()

    expect(removeOutbox).toHaveBeenCalledTimes(1)
    expect(ticketsCollection.findOne).toHaveBeenCalledTimes(1)
    expect(ticketsCollection.findOne).toHaveBeenCalledWith('ticket-remote-delete')
  })

  it('flushPendingAttachmentUploads uploads staged files and enqueues outbox metadata', async () => {
    const syncStore = useSyncStore()
    const pendingRemove = vi.fn()
    const attachmentPatch = vi.fn()
    const outboxUpsert = vi.fn()

    const db = {
      collections: {
        pendingAttachmentUploads: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  id: 'pending-1',
                  attachmentId: 'attachment-1',
                  ticketId: 'ticket-1',
                  locationId: 'loc-1',
                  fileName: 'photo.jpg',
                  mimeType: 'image/jpeg',
                  base64: 'Zm9v',
                  width: null,
                  height: null,
                  createdAt: 1
                }),
                remove: pendingRemove
              }
            ])
          }))
        },
        ticketAttachments: {
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => ({
              toJSON: () => ({
                id: 'attachment-1',
                ticketId: 'ticket-1',
                locationId: 'loc-1',
                uploadedByUserId: 'user-1',
                kind: 'Photo',
                storageKey: 'pending/photo.jpg',
                url: 'data:image/jpeg;base64,Zm9v',
                mimeType: 'image/jpeg',
                size: 3,
                width: null,
                height: null,
                createdAt: '2026-02-25T10:00:00.000Z',
                updatedAt: '2026-02-25T10:00:00.000Z',
                deletedAt: null
              }),
              incrementalPatch: attachmentPatch
            }))
          }))
        },
        outbox: {
          upsert: outboxUpsert
        }
      }
    }

    const api = {
      post: vi
        .fn()
        .mockResolvedValueOnce({
          storageKey: 'uploads/photo.jpg',
          uploadUrl: 'https://upload.local/1',
          headers: {}
        }),
      put: vi.fn().mockResolvedValue({
        url: '/uploads/photo.jpg',
        size: 123
      })
    }

    await syncStore.flushPendingAttachmentUploads(db, api, 'loc-1')

    expect(api.post).toHaveBeenNthCalledWith(1, '/attachments/presign', {
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg'
    })
    expect(api.put).toHaveBeenCalledWith('https://upload.local/1', { base64: 'Zm9v' })
    expect(attachmentPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: 'uploads/photo.jpg',
        url: '/uploads/photo.jpg',
        size: 123
      })
    )
    expect(outboxUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pending-attachment:pending-1',
        entity: 'ticketAttachments',
        operation: 'create',
        locationId: 'loc-1'
      })
    )
    expect(pendingRemove).toHaveBeenCalledTimes(1)
  })

  it('flushPendingAttachmentUploads removes dangling pending docs when attachment no longer exists', async () => {
    const syncStore = useSyncStore()
    const pendingRemove = vi.fn()
    const outboxUpsert = vi.fn()
    const apiPost = vi.fn()
    const apiPut = vi.fn()

    const db = {
      collections: {
        pendingAttachmentUploads: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  id: 'pending-missing',
                  attachmentId: 'attachment-missing',
                  ticketId: 'ticket-1',
                  locationId: 'loc-1',
                  fileName: 'missing.jpg',
                  mimeType: 'image/jpeg',
                  base64: 'Zm9v',
                  width: null,
                  height: null,
                  createdAt: 1
                }),
                remove: pendingRemove
              }
            ])
          }))
        },
        ticketAttachments: {
          findOne: vi.fn(() => ({
            exec: vi.fn(async () => null)
          }))
        },
        outbox: {
          upsert: outboxUpsert
        }
      }
    }

    await syncStore.flushPendingAttachmentUploads(
      db,
      {
        post: apiPost,
        put: apiPut
      },
      'loc-1'
    )

    expect(pendingRemove).toHaveBeenCalledTimes(1)
    expect(apiPost).not.toHaveBeenCalled()
    expect(apiPut).not.toHaveBeenCalled()
    expect(outboxUpsert).not.toHaveBeenCalled()
  })

  it('flushPendingAttachmentUploads continues with next file when one upload fails', async () => {
    const syncStore = useSyncStore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const firstPendingRemove = vi.fn()
    const secondPendingRemove = vi.fn()
    const firstAttachmentPatch = vi.fn()
    const secondAttachmentPatch = vi.fn()
    const outboxUpsert = vi.fn()

    const db = {
      collections: {
        pendingAttachmentUploads: {
          find: vi.fn(() => ({
            exec: vi.fn(async () => [
              {
                toJSON: () => ({
                  id: 'pending-1',
                  attachmentId: 'attachment-1',
                  ticketId: 'ticket-1',
                  locationId: 'loc-1',
                  fileName: 'first.jpg',
                  mimeType: 'image/jpeg',
                  base64: 'Zmlyc3Q=',
                  width: null,
                  height: null,
                  createdAt: 1
                }),
                remove: firstPendingRemove
              },
              {
                toJSON: () => ({
                  id: 'pending-2',
                  attachmentId: 'attachment-2',
                  ticketId: 'ticket-2',
                  locationId: 'loc-1',
                  fileName: 'second.jpg',
                  mimeType: 'image/jpeg',
                  base64: 'c2Vjb25k',
                  width: null,
                  height: null,
                  createdAt: 2
                }),
                remove: secondPendingRemove
              }
            ])
          }))
        },
        ticketAttachments: {
          findOne: vi.fn((id: string) => ({
            exec: vi.fn(async () => {
              if (id === 'attachment-1') {
                return {
                  toJSON: () => ({
                    id: 'attachment-1',
                    ticketId: 'ticket-1',
                    locationId: 'loc-1',
                    uploadedByUserId: 'user-1',
                    kind: 'Photo',
                    storageKey: 'pending/first.jpg',
                    url: '',
                    mimeType: 'image/jpeg',
                    size: 3,
                    width: null,
                    height: null,
                    createdAt: '2026-02-25T10:00:00.000Z',
                    updatedAt: '2026-02-25T10:00:00.000Z',
                    deletedAt: null
                  }),
                  incrementalPatch: firstAttachmentPatch
                }
              }

              return {
                toJSON: () => ({
                  id: 'attachment-2',
                  ticketId: 'ticket-2',
                  locationId: 'loc-1',
                  uploadedByUserId: 'user-1',
                  kind: 'Photo',
                  storageKey: 'pending/second.jpg',
                  url: '',
                  mimeType: 'image/jpeg',
                  size: 3,
                  width: null,
                  height: null,
                  createdAt: '2026-02-25T10:00:00.000Z',
                  updatedAt: '2026-02-25T10:00:00.000Z',
                  deletedAt: null
                }),
                incrementalPatch: secondAttachmentPatch
              }
            })
          }))
        },
        outbox: {
          upsert: outboxUpsert
        }
      }
    }

    const api = {
      post: vi
        .fn()
        .mockRejectedValueOnce(new Error('failed to fetch'))
        .mockResolvedValueOnce({
          storageKey: 'uploads/second.jpg',
          uploadUrl: 'https://upload.local/2',
          headers: {}
        }),
      put: vi.fn().mockResolvedValue({
        url: '/uploads/second.jpg',
        size: 222
      })
    }

    await syncStore.flushPendingAttachmentUploads(db, api, 'loc-1')

    expect(api.post).toHaveBeenCalledTimes(2)
    expect(firstPendingRemove).not.toHaveBeenCalled()
    expect(secondPendingRemove).toHaveBeenCalledTimes(1)
    expect(firstAttachmentPatch).not.toHaveBeenCalled()
    expect(secondAttachmentPatch).toHaveBeenCalledTimes(1)
    expect(outboxUpsert).toHaveBeenCalledTimes(1)
    expect(outboxUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pending-attachment:pending-2',
        entity: 'ticketAttachments'
      })
    )
    warnSpy.mockRestore()
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
