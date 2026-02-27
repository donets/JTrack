import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    let parsed = this.schema.safeParse(value)

    if (!parsed.success && typeof value === 'string') {
      try {
        parsed = this.schema.safeParse(JSON.parse(value))
      } catch {
        // Keep original validation error when raw value is not valid JSON.
      }
    }

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }

    return parsed.data
  }
}
