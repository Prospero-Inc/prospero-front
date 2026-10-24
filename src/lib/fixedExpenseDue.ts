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

export type DueStatus =
  | { kind: 'paid' }
  | { kind: 'overdue'; day: number }
  | { kind: 'today' }
  | { kind: 'upcoming'; daysLeft: number }

/**
 * Estado de un gasto fijo respecto de hoy, dentro del mes en curso. Un día
 * que el mes no tiene (31 en un mes de 30) cae en el último día del mes,
 * igual que `resolveOccurrenceDate` en el backend.
 */
export const resolveDueStatus = (
  dueDay: number,
  paidThisCycle: boolean,
  today: Date
): DueStatus => {
  if (paidThisCycle) return { kind: 'paid' }

  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate()
  const occurrenceDay = Math.min(dueDay, daysInMonth)
  const todayDay = today.getDate()

  if (occurrenceDay < todayDay) return { kind: 'overdue', day: occurrenceDay }
  if (occurrenceDay === todayDay) return { kind: 'today' }
  return { kind: 'upcoming', daysLeft: occurrenceDay - todayDay }
}
