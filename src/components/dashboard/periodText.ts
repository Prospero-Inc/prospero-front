import type { PeriodSummary } from '@/services/periods'

const DAY_MS = 24 * 60 * 60 * 1000

/** Last day of the period: its end, or the day before the next payday. */
const periodEnd = (period: PeriodSummary): Date | null => {
  if (period.endDate) return new Date(period.endDate)
  if (period.estimatedNextPaymentDate)
    return new Date(
      new Date(period.estimatedNextPaymentDate).getTime() - DAY_MS
    )
  return null
}

/**
 * "16 al 31 de oct" / "16 oct al 2 nov" (es), "Oct 16 – 31" /
 * "Oct 16 – Nov 2" (en). UTC like every other date in the app.
 */
export const formatPeriodRange = (
  period: PeriodSummary,
  locale: string
): string | null => {
  const end = periodEnd(period)
  if (!period.startDate || !end) return null
  const start = new Date(period.startDate)
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear()
  const day = (date: Date) => date.getUTCDate()
  const month = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
      .format(date)
      .replace('.', '')

  if (locale.startsWith('es'))
    return sameMonth
      ? `${day(start)} al ${day(end)} de ${month(end)}`
      : `${day(start)} ${month(start)} al ${day(end)} ${month(end)}`
  return sameMonth
    ? `${month(start)} ${day(start)} – ${day(end)}`
    : `${month(start)} ${day(start)} – ${month(end)} ${day(end)}`
}

/** "hoy", "ayer" or "29 oct", relative to today (UTC dates). */
export const formatRelativeDay = (
  isoDate: string,
  locale: string,
  labels: { today: string; yesterday: string }
): string => {
  const date = new Date(isoDate)
  const today = new Date()
  const utcDay = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const diff = Math.round((utcDay(today) - utcDay(date)) / DAY_MS)
  if (diff === 0) return labels.today
  if (diff === 1) return labels.yesterday
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
    .format(date)
    .replace('.', '')
}
