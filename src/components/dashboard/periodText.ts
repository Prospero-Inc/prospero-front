import { getTodayLocalDate } from '@/lib/getTodayLocalDate'
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

/**
 * "hoy", "ayer" or "29 oct". The movement's day (its UTC date part) is
 * compared with the device's local today: at 20:00 in El Salvador the UTC
 * date is already tomorrow.
 */
export const formatRelativeDay = (
  isoDate: string,
  locale: string,
  labels: { today: string; yesterday: string }
): string => {
  const day = isoDate.slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (day === getTodayLocalDate()) return labels.today
  if (day === getTodayLocalDate(yesterday)) return labels.yesterday
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
    .format(date)
    .replace('.', '')
}

/** Compact range for chips: "16–31 oct" / "16 oct – 2 nov". */
export const formatShortRange = (
  period: PeriodSummary,
  locale: string
): string | null => {
  const end = periodEnd(period)
  if (!period.startDate || !end) return null
  const start = new Date(period.startDate)
  const month = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
      .format(date)
      .replace('.', '')
  return start.getUTCMonth() === end.getUTCMonth()
    ? `${start.getUTCDate()}–${end.getUTCDate()} ${month(end)}`
    : `${start.getUTCDate()} ${month(start)} – ${end.getUTCDate()} ${month(
        end
      )}`
}

/** Day group title: "Hoy", "Ayer", or "Miércoles 29" (weekday + day). */
export const formatDayTitle = (
  isoDay: string,
  locale: string,
  labels: { today: string; yesterday: string }
): string => {
  const relative = formatRelativeDay(isoDay, locale, labels)
  if (relative === labels.today || relative === labels.yesterday)
    return relative
  const date = new Date(`${isoDay.slice(0, 10)}T00:00:00.000Z`)
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(date)
  return `${weekday} ${date.getUTCDate()}`
}
