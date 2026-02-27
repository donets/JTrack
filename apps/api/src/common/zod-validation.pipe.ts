import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'

const normalizeStringifiedPayload = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  let normalized: unknown = value

  // Handle clients that may send JSON payload as a quoted JSON string.
  for (let depth = 0; depth < 2 && typeof normalized === 'string'; depth += 1) {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      break
    }
  }

  return normalized
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(normalizeStringifiedPayload(value))

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }

    return parsed.data
  }
}
