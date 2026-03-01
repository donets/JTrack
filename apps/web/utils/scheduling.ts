type SchedulingLayout = {
  date: string
  startHour: number
  endHour: number
  hourWidthPx: number
}

const MINUTE_MS = 60 * 1000

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const parseDayStart = (date: string, startHour: number) => {
  const dayStart = new Date(`${date}T00:00:00`)
  dayStart.setHours(startHour, 0, 0, 0)
  return dayStart
}

const totalMinutes = (layout: SchedulingLayout) =>
  Math.max(1, (layout.endHour - layout.startHour) * 60)

export const timeToPositionPx = (iso: string | null | undefined, layout: SchedulingLayout) => {
  if (!iso) {
    return 0
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 0
  }

  const start = parseDayStart(layout.date, layout.startHour)
  const minutes = (date.getTime() - start.getTime()) / MINUTE_MS
  const clamped = clamp(minutes, 0, totalMinutes(layout))
  return (clamped / 60) * layout.hourWidthPx
}

export const timeRangeToRectPx = (
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  layout: SchedulingLayout
) => {
  const left = timeToPositionPx(startIso, layout)
  const right = timeToPositionPx(endIso ?? startIso, layout)
  const width = Math.max(12, right - left)

  return { left, width }
}

export const positionPxToRoundedIso = (
  positionPx: number,
  layout: SchedulingLayout,
  roundMinutes = 30
) => {
  const total = totalMinutes(layout)
  const rawMinutes = (positionPx / layout.hourWidthPx) * 60
  const clamped = clamp(rawMinutes, 0, total)
  const rounded = Math.round(clamped / roundMinutes) * roundMinutes
  const bounded = clamp(rounded, 0, total)

  const start = parseDayStart(layout.date, layout.startHour)
  const result = new Date(start.getTime() + bounded * MINUTE_MS)
  return result.toISOString()
}
