import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ZodValidationPipe } from './zod-validation.pipe'

const syncPullLikeSchema = z.object({
  locationId: z.string().min(1),
  lastPulledAt: z.number().int().nullable(),
  limit: z.number().int().min(1),
  cursor: z
    .object({
      snapshotAt: z.number().int(),
      ticketsOffset: z.number().int(),
      ticketCommentsOffset: z.number().int(),
      ticketAttachmentsOffset: z.number().int(),
      paymentRecordsOffset: z.number().int()
    })
    .nullable()
})

describe('ZodValidationPipe', () => {
  it('validates regular object payloads', () => {
    const pipe = new ZodValidationPipe(syncPullLikeSchema)

    const parsed = pipe.transform({
      locationId: 'loc-1',
      lastPulledAt: null,
      limit: 100,
      cursor: null
    })

    expect(parsed).toEqual({
      locationId: 'loc-1',
      lastPulledAt: null,
      limit: 100,
      cursor: null
    })
  })

  it('accepts JSON-stringified payloads', () => {
    const pipe = new ZodValidationPipe(syncPullLikeSchema)

    const parsed = pipe.transform(
      JSON.stringify({
        locationId: 'loc-1',
        lastPulledAt: null,
        limit: 100,
        cursor: null
      })
    )

    expect(parsed).toEqual({
      locationId: 'loc-1',
      lastPulledAt: null,
      limit: 100,
      cursor: null
    })
  })

  it('throws bad request when payload is not valid for schema', () => {
    const pipe = new ZodValidationPipe(syncPullLikeSchema)

    expect(() => pipe.transform('not-json')).toThrow(BadRequestException)
  })
})
