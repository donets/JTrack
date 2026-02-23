import { defineStore } from 'pinia'
import { syncPullResponseSchema, syncPushResponseSchema, type SyncChanges } from '@jtrack/shared'

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

function createEmptyChanges(): SyncChanges {
  return {
    tickets: { created: [], updated: [], deleted: [] },
    ticketComments: { created: [], updated: [], deleted: [] },
    ticketAttachments: { created: [], updated: [], deleted: [] },
    paymentRecords: { created: [], updated: [], deleted: [] }
  }
}

function getOrCreateClientId() {
  if (!import.meta.client) {
    return 'server-client'
  }

  const existing = localStorage.getItem('jtrack.sync.clientId')

  if (existing) {
    return existing
  }

  const generated = crypto.randomUUID()
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

      try {
        const locationId = locationStore.activeLocationId
        const db = useRxdb()
        const api = useApiClient()

        const syncStateId = `sync:${locationId}`
        const syncStateDoc = await db.collections.syncState.findOne(syncStateId).exec()
        const lastPulledAt = syncStateDoc?.toJSON().lastPulledAt ?? null

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
          const pushResponse = await api.post('/sync/push', {
            locationId,
            lastPulledAt,
            changes: outgoingChanges,
            clientId: this.clientId
          })

          syncPushResponseSchema.parse(pushResponse)

          for (const outboxDoc of outboxDocs) {
            await outboxDoc.remove()
          }
        }

        const pullResponseRaw = await api.post('/sync/pull', {
          locationId,
          lastPulledAt
        })

        const pullResponse = syncPullResponseSchema.parse(pullResponseRaw)

        await this.applyIncomingChanges(db, pullResponse.changes)

        if (syncStateDoc) {
          await syncStateDoc.incrementalPatch({
            lastPulledAt: pullResponse.timestamp,
            updatedAt: Date.now()
          })
        } else {
          await db.collections.syncState.insert({
            id: syncStateId,
            lastPulledAt: pullResponse.timestamp,
            updatedAt: Date.now()
          })
        }

        this.lastSyncedAt = pullResponse.timestamp
      } catch (error: any) {
        this.error = error?.data?.message ?? error?.message ?? 'Sync failed'
      } finally {
        this.syncing = false
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
