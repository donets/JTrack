import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocationStore } from './location'

const createCollectionMock = (ids: string[] = ['doc-1']) => {
  const remove = vi.fn()
  const bulkRemove = vi.fn()
  const find = vi.fn(() => ({
    exec: vi.fn(async () =>
      ids.map((id) => ({
        primary: id,
        toJSON: () => ({ id }),
        remove
      }))
    )
  }))

  return {
    find,
    bulkRemove,
    remove
  }
}

describe('location store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('persists active location and triggers cleanup only on change', async () => {
    const locationStore = useLocationStore()
    const cleanupSpy = vi.spyOn(locationStore, 'cleanupLocationScopedData').mockResolvedValue()

    locationStore.setActiveLocation('loc-1')

    expect(locationStore.activeLocationId).toBe('loc-1')
    expect(localStorage.getItem('jtrack.activeLocationId')).toBe('loc-1')
    expect(cleanupSpy).toHaveBeenCalledTimes(1)
    expect(cleanupSpy).toHaveBeenCalledWith('loc-1')

    locationStore.setActiveLocation('loc-1')
    expect(cleanupSpy).toHaveBeenCalledTimes(1)

    locationStore.setActiveLocation(null)
    expect(localStorage.getItem('jtrack.activeLocationId')).toBeNull()
    expect(cleanupSpy).toHaveBeenCalledWith(null)
  })

  it('removes records from non-active locations and old sync checkpoints', async () => {
    const tickets = createCollectionMock(['ticket-1'])
    const comments = createCollectionMock(['comment-1'])
    const attachments = createCollectionMock(['attachment-1'])
    const payments = createCollectionMock(['payment-1'])
    const outbox = createCollectionMock(['outbox-1'])
    const pendingUploads = createCollectionMock(['pending-1'])
    const syncState = createCollectionMock(['sync:loc-1'])

    vi.stubGlobal('useRxdb', () => ({
      collections: {
        tickets,
        ticketComments: comments,
        ticketAttachments: attachments,
        paymentRecords: payments,
        outbox,
        pendingAttachmentUploads: pendingUploads,
        syncState
      }
    }))

    const locationStore = useLocationStore()

    await locationStore.cleanupLocationScopedData('loc-2')

    for (const collection of [tickets, comments, attachments, payments, outbox, pendingUploads]) {
      expect(collection.find).toHaveBeenCalledWith({
        selector: {
          locationId: { $ne: 'loc-2' }
        }
      })
      expect(collection.bulkRemove).toHaveBeenCalledTimes(1)
    }

    expect(syncState.find).toHaveBeenCalledWith({
      selector: {
        id: { $ne: 'sync:loc-2' }
      }
    })
    expect(syncState.bulkRemove).toHaveBeenCalledWith(['sync:loc-1'])
  })

  it('removes all location-scoped records when location is unset', async () => {
    const tickets = createCollectionMock(['ticket-1', 'ticket-2'])
    const comments = createCollectionMock(['comment-1'])
    const attachments = createCollectionMock(['attachment-1'])
    const payments = createCollectionMock(['payment-1'])
    const outbox = createCollectionMock(['outbox-1'])
    const pendingUploads = createCollectionMock(['pending-1'])
    const syncState = createCollectionMock(['sync:loc-1'])

    vi.stubGlobal('useRxdb', () => ({
      collections: {
        tickets,
        ticketComments: comments,
        ticketAttachments: attachments,
        paymentRecords: payments,
        outbox,
        pendingAttachmentUploads: pendingUploads,
        syncState
      }
    }))

    const locationStore = useLocationStore()

    await locationStore.cleanupLocationScopedData(null)

    for (const collection of [tickets, comments, attachments, payments, outbox, pendingUploads]) {
      expect(collection.find).toHaveBeenCalledWith()
    }
    expect(tickets.bulkRemove).toHaveBeenCalledWith(['ticket-1', 'ticket-2'])
    expect(comments.bulkRemove).toHaveBeenCalledWith(['comment-1'])
    expect(attachments.bulkRemove).toHaveBeenCalledWith(['attachment-1'])
    expect(payments.bulkRemove).toHaveBeenCalledWith(['payment-1'])
    expect(outbox.bulkRemove).toHaveBeenCalledWith(['outbox-1'])
    expect(pendingUploads.bulkRemove).toHaveBeenCalledWith(['pending-1'])
    expect(syncState.find).toHaveBeenCalledWith()
    expect(syncState.bulkRemove).toHaveBeenCalledWith(['sync:loc-1'])
  })

  it('logs warning when async location cleanup fails', async () => {
    const locationStore = useLocationStore()
    const cleanupError = new Error('cleanup failed')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(locationStore, 'cleanupLocationScopedData').mockRejectedValueOnce(cleanupError)

    locationStore.setActiveLocation('loc-1')
    await Promise.resolve()

    expect(warnSpy).toHaveBeenCalledWith(
      '[location] failed to cleanup location-scoped data',
      cleanupError
    )
  })
})
