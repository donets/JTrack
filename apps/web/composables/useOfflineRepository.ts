import type {
  CreateAttachmentMetadataInput,
  CreateCommentInput,
  CreatePaymentRecordInput,
  CreateTicketInput,
  Ticket
} from '@jtrack/shared'

type OutboxEntity = 'tickets' | 'ticketComments' | 'ticketAttachments' | 'paymentRecords'

type OutboxOperation = 'create' | 'update' | 'delete'

export const useOfflineRepository = () => {
  const db = useRxdb()
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  const requireContext = () => {
    if (!authStore.user || !locationStore.activeLocationId) {
      throw new Error('User and active location are required')
    }

    return {
      userId: authStore.user.id,
      locationId: locationStore.activeLocationId
    }
  }

  const enqueueOutbox = async (
    entity: OutboxEntity,
    operation: OutboxOperation,
    payload: Record<string, unknown>
  ) => {
    const { locationId } = requireContext()

    await db.collections.outbox.insert({
      id: crypto.randomUUID(),
      locationId,
      entity,
      operation,
      payload,
      createdAt: Date.now(),
      processed: false,
      error: null
    })
  }

  const saveTicket = async (input: Partial<CreateTicketInput> & Partial<Ticket> & { id?: string }) => {
    const { userId, locationId } = requireContext()
    const now = new Date().toISOString()
    const ticketId = input.id ?? crypto.randomUUID()

    const existing = await db.collections.tickets.findOne(ticketId).exec()

    const ticket = {
      id: ticketId,
      locationId,
      createdByUserId: existing?.toJSON().createdByUserId ?? userId,
      assignedToUserId: input.assignedToUserId ?? null,
      title: input.title ?? 'Untitled Ticket',
      description: input.description ?? null,
      status: input.status ?? 'New',
      scheduledStartAt: input.scheduledStartAt ?? null,
      scheduledEndAt: input.scheduledEndAt ?? null,
      priority: input.priority ?? null,
      totalAmountCents: input.totalAmountCents ?? null,
      currency: input.currency ?? 'EUR',
      createdAt: existing?.toJSON().createdAt ?? now,
      updatedAt: now,
      deletedAt: null
    }

    await db.collections.tickets.upsert(ticket)

    await enqueueOutbox('tickets', existing ? 'update' : 'create', ticket)

    return ticket
  }

  const deleteTicket = async (ticketId: string) => {
    const ticket = await db.collections.tickets.findOne(ticketId).exec()

    if (!ticket) {
      return
    }

    await ticket.incrementalPatch({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await enqueueOutbox('tickets', 'delete', { id: ticketId })
  }

  const addComment = async (input: CreateCommentInput) => {
    const { userId, locationId } = requireContext()
    const now = new Date().toISOString()

    const comment = {
      id: crypto.randomUUID(),
      ticketId: input.ticketId,
      locationId,
      authorUserId: userId,
      body: input.body,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }

    await db.collections.ticketComments.insert(comment)
    await enqueueOutbox('ticketComments', 'create', comment)

    return comment
  }

  const addAttachmentMetadata = async (input: CreateAttachmentMetadataInput) => {
    const { userId, locationId } = requireContext()
    const now = new Date().toISOString()

    const attachment = {
      id: crypto.randomUUID(),
      ticketId: input.ticketId,
      locationId,
      uploadedByUserId: userId,
      kind: input.kind,
      storageKey: input.storageKey,
      url: input.url,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }

    await db.collections.ticketAttachments.insert(attachment)
    await enqueueOutbox('ticketAttachments', 'create', attachment)

    return attachment
  }

  const addPaymentRecord = async (input: CreatePaymentRecordInput) => {
    const { locationId } = requireContext()
    const now = new Date().toISOString()

    const payment = {
      id: crypto.randomUUID(),
      ticketId: input.ticketId,
      locationId,
      provider: input.provider,
      amountCents: input.amountCents,
      currency: input.currency,
      status: input.status,
      createdAt: now,
      updatedAt: now
    }

    await db.collections.paymentRecords.insert(payment)
    await enqueueOutbox('paymentRecords', 'create', payment)

    return payment
  }

  return {
    saveTicket,
    deleteTicket,
    addComment,
    addAttachmentMetadata,
    addPaymentRecord
  }
}
