import { Injectable, NotFoundException } from '@nestjs/common'
import type { CreateCommentInput } from '@jtrack/shared'
import { serializeDates } from '@/common/date-serializer'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locationId: string, ticketId: string) {
    const comments = await this.prisma.ticketComment.findMany({
      where: {
        locationId,
        ticketId,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    })

    return comments.map((comment: (typeof comments)[number]) => serializeDates(comment))
  }

  async create(locationId: string, authorUserId: string, input: CreateCommentInput) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: input.ticketId,
        locationId,
        deletedAt: null
      },
      select: { id: true }
    })

    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        locationId,
        ticketId: input.ticketId,
        authorUserId,
        body: input.body
      }
    })

    await this.prisma.ticketActivity.create({
      data: {
        ticketId: input.ticketId,
        locationId,
        userId: authorUserId,
        type: 'comment',
        metadata: {
          commentId: comment.id,
          bodyPreview: input.body.slice(0, 160)
        }
      }
    })

    return serializeDates(comment)
  }

  async remove(locationId: string, commentId: string) {
    const deleted = await this.prisma.ticketComment.updateMany({
      where: {
        id: commentId,
        locationId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    })

    if (deleted.count === 0) {
      throw new NotFoundException('Comment not found')
    }

    return { ok: true }
  }
}
