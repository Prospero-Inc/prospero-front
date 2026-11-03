/**
 * El backend solo usa el **día del mes** de `FixedExpense.dueDate` (ver
 * `occurrence.util.ts` en prospero-backend): el resto de la fecha no
 * significa nada. Por eso el formulario pide un día y no una fecha.
 */

/** Día del mes (1–31) de un `dueDate` ISO. UTC, como lo lee el backend. */
export const dueDayOf = (dueDate: string): number =>
  Number(dueDate.slice(8, 10))

/** Fecha sintética para un día del mes. Enero porque tiene 31 días (todo día
 * es válido); el año fijo deja claro que la fecha completa no importa. */
export const dueDateFromDay = (day: number): string =>
  `2000-01-${String(day).padStart(2, '0')}`

/** The day a due day falls on in `today`'s month: a day the month doesn't
 * have (31 in a 30-day month) lands on its last day, like
 * `resolveOccurrenceDate` in the backend. */
export const occurrenceDayOf = (dueDay: number, today: Date): number =>
  Math.min(
    dueDay,
    new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  )

export type DueStatus =
  | { kind: 'paid' }
  | { kind: 'overdue'; day: number }
  | { kind: 'today' }
  | { kind: 'upcoming'; daysLeft: number }

/** Estado de un gasto fijo respecto de hoy, dentro del mes en curso. */
export const resolveDueStatus = (
  dueDay: number,
  paidThisCycle: boolean,
  today: Date
): DueStatus => {
  if (paidThisCycle) return { kind: 'paid' }

  const occurrenceDay = occurrenceDayOf(dueDay, today)
  const todayDay = today.getDate()

  if (occurrenceDay < todayDay) return { kind: 'overdue', day: occurrenceDay }
  if (occurrenceDay === todayDay) return { kind: 'today' }
  return { kind: 'upcoming', daysLeft: occurrenceDay - todayDay }
}
