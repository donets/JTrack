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

type SyncEntityRecord = { id: string; updatedAt: string }

function createEmptyChanges(): SyncChanges {
  return {
    tickets: { created: [], updated: [], deleted: [] },
    ticketComments: { created: [], updated: [], deleted: [] },
    ticketAttachments: { created: [], updated: [], deleted: [] },
    paymentRecords: { created: [], updated: [], deleted: [] }
  }
}

function createEchoSuppressionState(): EchoSuppressionState {
  return {
    tickets: { upsertIds: new Set(), deletedIds: new Set() },
    ticketComments: { upsertIds: new Set(), deletedIds: new Set() },
    ticketAttachments: { upsertIds: new Set(), deletedIds: new Set() },
    paymentRecords: { upsertIds: new Set(), deletedIds: new Set() }
  }
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

function filterEchoedUpserts<TRecord extends SyncEntityRecord>(
  records: TRecord[],
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

    return updatedAt > pushTimestamp
  })
}

function filterEchoedPullChanges(
  changes: SyncChanges,
  echoedState: EchoSuppressionState,
  pushTimestamp: number
): SyncChanges {
  return {
    tickets: {
      created: filterEchoedUpserts(changes.tickets.created, echoedState.tickets.upsertIds, pushTimestamp),
      updated: filterEchoedUpserts(changes.tickets.updated, echoedState.tickets.upsertIds, pushTimestamp),
      deleted: changes.tickets.deleted.filter((deletedId: string) => !echoedState.tickets.deletedIds.has(deletedId))
    },
    ticketComments: {
      created: filterEchoedUpserts(
        changes.ticketComments.created,
        echoedState.ticketComments.upsertIds,
        pushTimestamp
      ),
      updated: filterEchoedUpserts(
        changes.ticketComments.updated,
        echoedState.ticketComments.upsertIds,
        pushTimestamp
      ),
      deleted: changes.ticketComments.deleted.filter(
        (deletedId: string) => !echoedState.ticketComments.deletedIds.has(deletedId)
      )
    },
    ticketAttachments: {
      created: filterEchoedUpserts(
        changes.ticketAttachments.created,
        echoedState.ticketAttachments.upsertIds,
        pushTimestamp
      ),
      updated: filterEchoedUpserts(
        changes.ticketAttachments.updated,
        echoedState.ticketAttachments.upsertIds,
        pushTimestamp
      ),
      deleted: changes.ticketAttachments.deleted.filter(
        (deletedId: string) => !echoedState.ticketAttachments.deletedIds.has(deletedId)
      )
    },
    paymentRecords: {
      created: filterEchoedUpserts(
        changes.paymentRecords.created,
        echoedState.paymentRecords.upsertIds,
        pushTimestamp
      ),
      updated: filterEchoedUpserts(
        changes.paymentRecords.updated,
        echoedState.paymentRecords.upsertIds,
        pushTimestamp
      ),
      deleted: changes.paymentRecords.deleted.filter(
        (deletedId: string) => !echoedState.paymentRecords.deletedIds.has(deletedId)
      )
    }
  }
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

        const echoedState = buildEchoSuppressionState(outgoingChanges)

        if (outboxDocs.length > 0) {
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
            pushTimestamp === null
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
