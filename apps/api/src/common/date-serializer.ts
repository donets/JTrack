type SerializedDates<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? SerializedDates<U>[]
    : T extends object
      ? { [K in keyof T]: SerializedDates<T[K]> }
      : T

export function serializeDates<T>(value: T): SerializedDates<T> {
  if (value instanceof Date) {
    return value.toISOString() as SerializedDates<T>
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeDates(item)) as SerializedDates<T>
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      serializeDates(entry)
    ])

    return Object.fromEntries(entries) as SerializedDates<T>
  }

  return value as SerializedDates<T>
}
