import { defineStore } from 'pinia'
import {
  syncPullResponseSchema,
  syncPushResponseSchema,
  type SyncChanges,
  type SyncPullCursor
} from '@jtrack/shared'

interface SyncState {
  syncing: boolean
  lastSyncedAt: number | null
  error: string | null
  clientId: string
}

type EntityCollection = 'tickets' | 'ticketComments' | 'ticketAttachments' | 'paymentRecords'

type OutboxEntity =
  | 'tickets'
  | 'ticketComments'
  | 'ticketAttachments'
  | 'paymentRecords'

const entityCollections: EntityCollection[] = [
  'tickets',
  'ticketComments',
  'ticketAttachments',
  'paymentRecords'
]

type EchoSuppressionState = Record<
  EntityCollection,
  {
    upsertIds: Set<string>
    deletedIds: Set<string>
  }
>

interface PendingAttachmentUpload {
  id: string
  attachmentId: string
  ticketId: string
  locationId: string
  fileName: string
  mimeType: string
  base64: string
  width: number | null
  height: number | null
  createdAt: number
}

function createEmptyChanges(): SyncChanges {
  return {
    tickets: { created: [], updated: [], deleted: [] },
    ticketComments: { created: [], updated: [], deleted: [] },
    ticketAttachments: { created: [], updated: [], deleted: [] },
    paymentRecords: { created: [], updated: [], deleted: [] }
  }
}

function createEchoSuppressionState(): EchoSuppressionState {
  const state = {} as EchoSuppressionState

  for (const entity of entityCollections) {
    state[entity] = {
      upsertIds: new Set<string>(),
      deletedIds: new Set<string>()
    }
  }

  return state
}

function buildEchoSuppressionState(changes: SyncChanges): EchoSuppressionState {
  const state = createEchoSuppressionState()

  for (const entity of entityCollections) {
    for (const record of [...changes[entity].created, ...changes[entity].updated] as Array<{
      id: string
    }>) {
      state[entity].upsertIds.add(record.id)
    }

    for (const deletedId of changes[entity].deleted) {
      state[entity].deletedIds.add(deletedId)
    }
  }

  return state
}

function filterEchoedUpserts<TRecords extends Array<{ id: string; updatedAt: string }>>(
  records: TRecords,
  pushedIds: Set<string>,
  pushTimestamp: number
) {
  return records.filter((record) => {
    if (!pushedIds.has(record.id)) {
      return true
    }

    const updatedAt = Date.parse(record.updatedAt)
    if (Number.isNaN(updatedAt)) {
      return true
    }

    // Equal timestamp is treated as same-cycle echo from the just-completed push.
    return updatedAt > pushTimestamp
  }) as TRecords
}

function filterEchoedEntityChanges<TKey extends EntityCollection>(
  changes: SyncChanges[TKey],
  echoedState: EchoSuppressionState[TKey],
  pushTimestamp: number
): SyncChanges[TKey] {
  return {
    created: filterEchoedUpserts(changes.created, echoedState.upsertIds, pushTimestamp),
    updated: filterEchoedUpserts(changes.updated, echoedState.upsertIds, pushTimestamp),
    // Deleted payloads contain IDs only, so suppression is ID-based.
    deleted: changes.deleted.filter((deletedId: string) => !echoedState.deletedIds.has(deletedId))
  } as SyncChanges[TKey]
}

function setEntityChanges<TKey extends EntityCollection>(
  changes: SyncChanges,
  entity: TKey,
  value: SyncChanges[TKey]
) {
  changes[entity] = value
}

function filterEchoedPullChanges(
  changes: SyncChanges,
  echoedState: EchoSuppressionState,
  pushTimestamp: number
): SyncChanges {
  const filtered = createEmptyChanges()

  for (const entity of entityCollections) {
    const filteredEntityChanges = filterEchoedEntityChanges(
      changes[entity],
      echoedState[entity],
      pushTimestamp
    )
    setEntityChanges(filtered, entity, filteredEntityChanges)
  }

  return filtered
}

function generateClientId() {
  if (!import.meta.client) {
    return 'server-client'
  }

  return crypto.randomUUID()
}

function getOrCreateClientId() {
  if (!import.meta.client) {
    return 'server-client'
  }

  const existing = localStorage.getItem('jtrack.sync.clientId')

  if (existing) {
    return existing
  }

  const generated = generateClientId()
  localStorage.setItem('jtrack.sync.clientId', generated)
  return generated
}

export const useSyncStore = defineStore('sync', {
  state: (): SyncState => ({
    syncing: false,
    lastSyncedAt: null,
    error: null,
    clientId: getOrCreateClientId()
  }),
  actions: {
    async syncNow() {
      const authStore = useAuthStore()
      const locationStore = useLocationStore()

      if (!authStore.isAuthenticated || !locationStore.activeLocationId) {
        return
      }

      if (this.syncing) {
        return
      }

      if (import.meta.client && !navigator.onLine) {
        this.error = 'Offline: sync queued until connection is restored'
        return
      }

      this.syncing = true
      this.error = null

      if (import.meta.client && !localStorage.getItem('jtrack.sync.clientId')) {
        localStorage.setItem('jtrack.sync.clientId', this.clientId)
      }

      try {
        const locationId = locationStore.activeLocationId
        const db = useRxdb()
        const api = useApiClient()

        const syncStateId = `sync:${locationId}`
        const syncStateDoc = await db.collections.syncState.findOne(syncStateId).exec()
        const lastPulledAt = syncStateDoc?.toJSON().lastPulledAt ?? null
        let pushTimestamp: number | null = null
        let echoedState: EchoSuppressionState | null = null
        await this.flushPendingAttachmentUploads(db, api, locationId)

        const outboxDocs = await db.collections.outbox
          .find({
            selector: {
              locationId,
              processed: false
            }
          })
          .exec()
        outboxDocs.sort(
          (left: any, right: any) => left.toJSON().createdAt - right.toJSON().createdAt
        )

        const outgoingChanges = createEmptyChanges()

        for (const outboxDoc of outboxDocs) {
          const outbox = outboxDoc.toJSON() as {
            entity: OutboxEntity
            operation: 'create' | 'update' | 'delete'
            payload: Record<string, unknown>
          }

          if (outbox.operation === 'delete') {
            const deletedId = String(outbox.payload.id)
            outgoingChanges[outbox.entity].deleted.push(deletedId)
            continue
          }

          if (outbox.operation === 'create') {
            outgoingChanges[outbox.entity].created.push(outbox.payload as never)
            continue
          }

          outgoingChanges[outbox.entity].updated.push(outbox.payload as never)
        }

        if (outboxDocs.length > 0) {
          echoedState = buildEchoSuppressionState(outgoingChanges)

          const pushResponseRaw = await api.post('/sync/push', {
            locationId,
            lastPulledAt,
            changes: outgoingChanges,
            clientId: this.clientId
          })

          const pushResponse = syncPushResponseSchema.parse(pushResponseRaw)
          pushTimestamp = pushResponse.newTimestamp

          for (const outboxDoc of outboxDocs) {
            await outboxDoc.remove()
          }
        }

        let pullHasMore = true
        let pullCursor: SyncPullCursor | null = null
        let pullTimestamp = lastPulledAt ?? Date.now()

        while (pullHasMore) {
          const pullResponseRaw = await api.post('/sync/pull', {
            locationId,
            lastPulledAt,
            limit: 100,
            cursor: pullCursor
          })

          const pullResponse = syncPullResponseSchema.parse(pullResponseRaw)
          const pullChanges =
            pushTimestamp === null || echoedState === null
              ? pullResponse.changes
              : filterEchoedPullChanges(pullResponse.changes, echoedState, pushTimestamp)

          await this.applyIncomingChanges(db, pullChanges)
          pullTimestamp = pullResponse.timestamp
          pullHasMore = pullResponse.hasMore
          pullCursor = pullResponse.nextCursor

          if (pullHasMore && !pullCursor) {
            throw new Error('Sync pull cursor is missing for paginated response')
          }
        }

        if (syncStateDoc) {
          await syncStateDoc.incrementalPatch({
            lastPulledAt: pullTimestamp,
            updatedAt: Date.now()
          })
        } else {
          await db.collections.syncState.insert({
            id: syncStateId,
            lastPulledAt: pullTimestamp,
            updatedAt: Date.now()
          })
        }

        this.lastSyncedAt = pullTimestamp
      } catch (error: any) {
        this.error = error?.data?.message ?? error?.message ?? 'Sync failed'
      } finally {
        this.syncing = false
      }
    },

    async flushPendingAttachmentUploads(db: any, api: any, locationId: string) {
      const pendingCollection = db.collections.pendingAttachmentUploads

      if (!pendingCollection) {
        return
      }

      const pendingDocs = await pendingCollection
        .find({
          selector: { locationId }
        })
        .exec()

      pendingDocs.sort((left: any, right: any) => left.toJSON().createdAt - right.toJSON().createdAt)

      for (const pendingDoc of pendingDocs) {
        const pending = pendingDoc.toJSON() as PendingAttachmentUpload
        try {
          const attachmentDoc = await db.collections.ticketAttachments.findOne(pending.attachmentId).exec()

          if (!attachmentDoc) {
            await pendingDoc.remove()
            continue
          }

          const attachment = attachmentDoc.toJSON()
          const now = new Date().toISOString()
          const kind = pending.mimeType.startsWith('image/') ? 'Photo' : 'File'
          const needsUpload = String(attachment.storageKey).startsWith('pending/')

          let finalizedAttachment = attachment

          if (needsUpload) {
            const presign = (await api.post('/attachments/presign', {
              fileName: pending.fileName,
              mimeType: pending.mimeType
            })) as {
              storageKey: string
              uploadUrl: string
              headers: Record<string, string>
            }

            const uploadResult = (await api.put(presign.uploadUrl, {
              base64: pending.base64
            })) as { url: string; size: number }

            finalizedAttachment = {
              id: attachment.id,
              ticketId: attachment.ticketId,
              locationId: attachment.locationId,
              uploadedByUserId: attachment.uploadedByUserId,
              kind,
              storageKey: presign.storageKey,
              url: uploadResult.url,
              mimeType: pending.mimeType,
              size: uploadResult.size,
              width: pending.width ?? null,
              height: pending.height ?? null,
              createdAt: attachment.createdAt,
              updatedAt: now,
              deletedAt: attachment.deletedAt
            }

            await attachmentDoc.incrementalPatch({
              kind,
              storageKey: presign.storageKey,
              url: uploadResult.url,
              mimeType: pending.mimeType,
              size: uploadResult.size,
              width: pending.width ?? null,
              height: pending.height ?? null,
              updatedAt: now
            })
          }

          await db.collections.outbox.upsert({
            id: `pending-attachment:${pending.id}`,
            locationId,
            entity: 'ticketAttachments',
            operation: 'create',
            payload: finalizedAttachment,
            createdAt: Date.now(),
            processed: false,
            error: null
          })
          await pendingDoc.remove()
        } catch (error) {
          console.warn('[sync] failed to flush pending attachment upload, will retry', error)
          continue
        }
      }
    },

    clearSyncData() {
      this.lastSyncedAt = null
      this.error = null
      this.clientId = generateClientId()
      if (import.meta.client) {
        localStorage.removeItem('jtrack.sync.clientId')
      }
    },

    async applyIncomingChanges(db: any, changes: SyncChanges) {
      await this.applyEntityChanges(db, 'tickets', changes.tickets)
      await this.applyEntityChanges(db, 'ticketComments', changes.ticketComments)
      await this.applyEntityChanges(db, 'ticketAttachments', changes.ticketAttachments)
      await this.applyEntityChanges(db, 'paymentRecords', changes.paymentRecords)
    },

    async applyEntityChanges(
      db: any,
      collectionName: EntityCollection,
      changes: { created: any[]; updated: any[]; deleted: string[] }
    ) {
      const collection = db.collections[collectionName]

      for (const document of [...changes.created, ...changes.updated]) {
        await collection.upsert(document)
      }

      for (const deletedId of changes.deleted) {
        const doc = await collection.findOne(deletedId).exec()

        if (!doc) {
          continue
        }

        if ('deletedAt' in doc.toJSON()) {
          await doc.incrementalPatch({ deletedAt: new Date().toISOString() })
        } else {
          await doc.remove()
        }
      }
    }
  }
})
