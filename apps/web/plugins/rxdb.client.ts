import { createRxDatabase, type RxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { removeRxDatabase } from 'rxdb/plugins/core'

const ticketSchema = {
  title: 'tickets',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    locationId: { type: 'string' },
    ticketNumber: { type: ['number', 'null'] },
    createdByUserId: { type: 'string' },
    assignedToUserId: { type: ['string', 'null'] },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          checked: { type: 'boolean' }
        },
        required: ['id', 'label', 'checked'],
        additionalProperties: false
      }
    },
    status: { type: 'string' },
    scheduledStartAt: { type: ['string', 'null'] },
    scheduledEndAt: { type: ['string', 'null'] },
    priority: { type: ['string', 'null'] },
    totalAmountCents: { type: ['number', 'null'] },
    currency: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    deletedAt: { type: ['string', 'null'] }
  },
  required: ['id', 'locationId', 'createdByUserId', 'title', 'status', 'currency', 'createdAt', 'updatedAt']
}

const ticketCommentSchema = {
  title: 'ticketComments',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    ticketId: { type: 'string' },
    locationId: { type: 'string' },
    authorUserId: { type: 'string' },
    body: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    deletedAt: { type: ['string', 'null'] }
  },
  required: ['id', 'ticketId', 'locationId', 'authorUserId', 'body', 'createdAt', 'updatedAt']
}

const ticketActivitySchema = {
  title: 'ticketActivities',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    ticketId: { type: 'string' },
    locationId: { type: 'string' },
    userId: { type: ['string', 'null'] },
    type: { type: 'string' },
    metadata: { type: 'object', additionalProperties: true },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'ticketId', 'locationId', 'type', 'metadata', 'createdAt', 'updatedAt']
}

const ticketAttachmentSchema = {
  title: 'ticketAttachments',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    ticketId: { type: 'string' },
    locationId: { type: 'string' },
    uploadedByUserId: { type: 'string' },
    kind: { type: 'string' },
    storageKey: { type: 'string' },
    url: { type: 'string' },
    mimeType: { type: 'string' },
    size: { type: 'number' },
    width: { type: ['number', 'null'] },
    height: { type: ['number', 'null'] },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    deletedAt: { type: ['string', 'null'] }
  },
  required: [
    'id',
    'ticketId',
    'locationId',
    'uploadedByUserId',
    'kind',
    'storageKey',
    'url',
    'mimeType',
    'size',
    'createdAt',
    'updatedAt'
  ]
}

const paymentRecordSchema = {
  title: 'paymentRecords',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    ticketId: { type: 'string' },
    locationId: { type: 'string' },
    provider: { type: 'string' },
    amountCents: { type: 'number' },
    currency: { type: 'string' },
    status: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'ticketId', 'locationId', 'provider', 'amountCents', 'currency', 'status', 'createdAt', 'updatedAt']
}

const outboxSchema = {
  title: 'outbox',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    locationId: { type: 'string' },
    entity: { type: 'string' },
    operation: { type: 'string' },
    payload: { type: 'object', additionalProperties: true },
    createdAt: { type: 'number' },
    processed: { type: 'boolean' },
    error: { type: ['string', 'null'] }
  },
  required: ['id', 'locationId', 'entity', 'operation', 'payload', 'createdAt', 'processed']
}

const syncStateSchema = {
  title: 'syncState',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 128 },
    lastPulledAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  required: ['id', 'lastPulledAt', 'updatedAt']
}

const pendingAttachmentUploadSchema = {
  title: 'pendingAttachmentUploads',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 64 },
    attachmentId: { type: 'string' },
    ticketId: { type: 'string' },
    locationId: { type: 'string' },
    fileName: { type: 'string' },
    mimeType: { type: 'string' },
    base64: { type: 'string' },
    width: { type: ['number', 'null'] },
    height: { type: ['number', 'null'] },
    createdAt: { type: 'number' }
  },
  required: [
    'id',
    'attachmentId',
    'ticketId',
    'locationId',
    'fileName',
    'mimeType',
    'base64',
    'createdAt'
  ]
}

let rxdbPromise: Promise<RxDatabase> | null = null
let rxdbInstance: RxDatabase | null = null
const DATABASE_NAME = 'jtrack_crm'
const rxStorage = getRxStorageDexie()

const isSchemaMismatchError = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'DB6'
  )

async function createDatabase() {
  const database = await createRxDatabase({
    name: DATABASE_NAME,
    storage: rxStorage,
    closeDuplicates: true
  })

  await database.addCollections({
    tickets: { schema: ticketSchema },
    ticketActivities: { schema: ticketActivitySchema },
    ticketComments: { schema: ticketCommentSchema },
    ticketAttachments: { schema: ticketAttachmentSchema },
    paymentRecords: { schema: paymentRecordSchema },
    outbox: { schema: outboxSchema },
    syncState: { schema: syncStateSchema },
    pendingAttachmentUploads: { schema: pendingAttachmentUploadSchema }
  })

  return database
}

async function createDatabaseWithRecovery() {
  try {
    return await createDatabase()
  } catch (error) {
    if (!isSchemaMismatchError(error)) {
      throw error
    }

    // When local schema drifts from persisted IndexedDB state, reset and rehydrate from sync.
    await removeRxDatabase(DATABASE_NAME, rxStorage)
    return createDatabase()
  }
}

async function getOrCreateDatabase() {
  if (!rxdbPromise) {
    rxdbPromise = createDatabaseWithRecovery().then((database) => {
      rxdbInstance = database
      return database
    })
  }

  const database = await rxdbPromise
  rxdbInstance = database
  return database
}

export function getActiveDatabase() {
  if (!rxdbInstance) {
    throw new Error('RxDB is not initialized')
  }

  return rxdbInstance
}

export async function destroyDatabase() {
  if (rxdbPromise || rxdbInstance) {
    const db = rxdbInstance ?? (await rxdbPromise!)
    await db.remove()
  }

  rxdbPromise = null
  rxdbInstance = null

  // Recreate a clean database so current SPA instance can keep operating after logout/login.
  await getOrCreateDatabase()
}

export default defineNuxtPlugin(async () => {
  const database = await getOrCreateDatabase()

  return {
    provide: {
      rxdb: database
    }
  }
})
