import type {
  CreateAttachmentMetadataInput,
  CreateCommentInput,
  CreatePaymentRecordInput,
  TicketChecklistItem,
  Ticket,
  TicketStatus
} from '@jtrack/shared'

type OutboxEntity = 'tickets' | 'ticketComments' | 'ticketAttachments' | 'paymentRecords'

type OutboxOperation = 'create' | 'update' | 'delete'

interface PendingAttachmentUploadInput {
  ticketId: string
  fileName: string
  mimeType: string
  base64: string
  width?: number
  height?: number
}

interface SaveTicketInput {
  id?: string
  ticketNumber?: number | null
  title?: string
  description?: string | null
  checklist?: TicketChecklistItem[]
  status?: TicketStatus
  assignedToUserId?: string | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  priority?: string | null
  totalAmountCents?: number | null
  currency?: string
}

const MAX_OFFLINE_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

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

  const saveTicket = async (input: SaveTicketInput) => {
    const { userId, locationId } = requireContext()
    const now = new Date().toISOString()
    const ticketId = input.id ?? crypto.randomUUID()

    const existing = await db.collections.tickets.findOne(ticketId).exec()
    const existingTicket = existing?.toJSON() as Ticket | undefined

    const ticket: Ticket = {
      id: ticketId,
      locationId: existingTicket?.locationId ?? locationId,
      ticketNumber: existingTicket?.ticketNumber,
      createdByUserId: existingTicket?.createdByUserId ?? userId,
      assignedToUserId: existingTicket?.assignedToUserId ?? null,
      title: existingTicket?.title ?? 'Untitled Ticket',
      description: existingTicket?.description ?? null,
      checklist: existingTicket?.checklist ?? [],
      status: existingTicket?.status ?? 'New',
      scheduledStartAt: existingTicket?.scheduledStartAt ?? null,
      scheduledEndAt: existingTicket?.scheduledEndAt ?? null,
      priority: existingTicket?.priority ?? null,
      totalAmountCents: existingTicket?.totalAmountCents ?? null,
      currency: existingTicket?.currency ?? 'EUR',
      createdAt: existingTicket?.createdAt ?? now,
      updatedAt: now,
      deletedAt: existingTicket?.deletedAt ?? null
    }

    if (input.title !== undefined) {
      ticket.title = input.title
    }

    if (input.ticketNumber !== undefined) {
      ticket.ticketNumber = input.ticketNumber ?? undefined
    }

    if (input.description !== undefined) {
      ticket.description = input.description ?? null
    }

    if (input.checklist !== undefined) {
      ticket.checklist = input.checklist
    }

    if (input.status !== undefined) {
      ticket.status = input.status
    }

    if (input.assignedToUserId !== undefined) {
      ticket.assignedToUserId = input.assignedToUserId ?? null
    }

    if (input.scheduledStartAt !== undefined) {
      ticket.scheduledStartAt = input.scheduledStartAt ?? null
    }

    if (input.scheduledEndAt !== undefined) {
      ticket.scheduledEndAt = input.scheduledEndAt ?? null
    }

    if (input.priority !== undefined) {
      ticket.priority = input.priority ?? null
    }

    if (input.totalAmountCents !== undefined) {
      ticket.totalAmountCents = input.totalAmountCents ?? null
    }

    if (input.currency !== undefined) {
      ticket.currency = input.currency
    }

    if (existing) {
      await existing.incrementalPatch({
        title: ticket.title,
        ticketNumber: ticket.ticketNumber,
        description: ticket.description,
        checklist: ticket.checklist,
        status: ticket.status,
        assignedToUserId: ticket.assignedToUserId,
        scheduledStartAt: ticket.scheduledStartAt,
        scheduledEndAt: ticket.scheduledEndAt,
        priority: ticket.priority,
        totalAmountCents: ticket.totalAmountCents,
        currency: ticket.currency,
        updatedAt: ticket.updatedAt,
        deletedAt: ticket.deletedAt
      })
    } else {
      await db.collections.tickets.insert(ticket)
    }

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

  const deleteComment = async (commentId: string) => {
    const comment = await db.collections.ticketComments.findOne(commentId).exec()

    if (!comment) {
      return
    }

    const now = new Date().toISOString()

    await comment.incrementalPatch({
      deletedAt: now,
      updatedAt: now
    })

    await enqueueOutbox('ticketComments', 'delete', { id: commentId })
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

  const deleteAttachment = async (attachmentId: string) => {
    const attachment = await db.collections.ticketAttachments.findOne(attachmentId).exec()

    if (!attachment) {
      return
    }

    const now = new Date().toISOString()

    await attachment.incrementalPatch({
      deletedAt: now,
      updatedAt: now
    })

    const pendingUploads = await db.collections.pendingAttachmentUploads
      .find({
        selector: {
          attachmentId
        }
      })
      .exec()

    if (pendingUploads.length > 0) {
      await db.collections.pendingAttachmentUploads.bulkRemove(pendingUploads.map((doc) => doc.primary))
    }

    await enqueueOutbox('ticketAttachments', 'delete', { id: attachmentId })
  }

  const stageAttachmentUpload = async (input: PendingAttachmentUploadInput) => {
    const { userId, locationId } = requireContext()
    const now = new Date().toISOString()
    const attachmentId = crypto.randomUUID()
    const approximateSize = Math.max(1, Math.floor((input.base64.length * 3) / 4))

    if (approximateSize > MAX_OFFLINE_ATTACHMENT_SIZE_BYTES) {
      throw new Error(
        `Attachment exceeds offline staging limit (${Math.floor(MAX_OFFLINE_ATTACHMENT_SIZE_BYTES / (1024 * 1024))}MB)`
      )
    }

    const kind = input.mimeType.startsWith('image/') ? 'Photo' : 'File'

    const attachment = {
      id: attachmentId,
      ticketId: input.ticketId,
      locationId,
      uploadedByUserId: userId,
      kind,
      storageKey: `pending/${input.fileName}`,
      // Base64 is stored in pendingAttachmentUploads only to avoid duplicate large payloads.
      url: '',
      mimeType: input.mimeType,
      size: approximateSize,
      width: input.width ?? null,
      height: input.height ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }

    await db.collections.ticketAttachments.insert(attachment)
    await db.collections.pendingAttachmentUploads.insert({
      id: crypto.randomUUID(),
      attachmentId,
      ticketId: input.ticketId,
      locationId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      base64: input.base64,
      width: input.width ?? null,
      height: input.height ?? null,
      createdAt: Date.now()
    })

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
    deleteComment,
    addAttachmentMetadata,
    deleteAttachment,
    stageAttachmentUpload,
    addPaymentRecord
  }
}
