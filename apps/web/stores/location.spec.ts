import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocationStore } from './location'

const createCollectionMock = () => {
  const remove = vi.fn()
  const find = vi.fn((query?: { selector?: Record<string, unknown> }) => ({
    exec: vi.fn(async () => (query?.selector ? [{ remove }] : []))
  }))

  return {
    find,
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
    const tickets = createCollectionMock()
    const comments = createCollectionMock()
    const attachments = createCollectionMock()
    const payments = createCollectionMock()
    const outbox = createCollectionMock()
    const pendingUploads = createCollectionMock()
    const syncState = createCollectionMock()

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
      expect(collection.remove).toHaveBeenCalledTimes(1)
    }

    expect(syncState.find).toHaveBeenCalledWith({
      selector: {
        id: { $ne: 'sync:loc-2' }
      }
    })
    expect(syncState.remove).toHaveBeenCalledTimes(1)
  })
})
