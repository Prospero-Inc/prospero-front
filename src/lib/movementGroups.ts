export interface DayGroup<T> {
  /** YYYY-MM-DD (UTC, igual que el resto de la app: las fechas llegan como
   * medianoche UTC). */
  day: string
  items: T[]
  /** Total del día sobre *todas* sus filas, no solo las visibles: si el
   * "Mostrar más" corta un día a la mitad, el encabezado no miente. */
  total: number
  /** Filas del día que quedaron fuera por el "Mostrar más". */
  hiddenCount: number
}

/**
 * Agrupa `visible` por día conservando su orden (ya viene del más reciente
 * al más antiguo). Los totales se calculan sobre `all`, que es la lista
 * filtrada completa de la que `visible` es un prefijo.
 */
export const groupByDay = <T>(
  visible: T[],
  all: T[],
  getDate: (_item: T) => string,
  getAmount: (_item: T) => number
): DayGroup<T>[] => {
  const totals = new Map<string, { total: number; count: number }>()
  for (const item of all) {
    const day = getDate(item).slice(0, 10)
    const current = totals.get(day) ?? { total: 0, count: 0 }
    totals.set(day, {
      total: current.total + getAmount(item),
      count: current.count + 1
    })
  }

  const groups: DayGroup<T>[] = []
  for (const item of visible) {
    const day = getDate(item).slice(0, 10)
    const last = groups[groups.length - 1]
    if (last?.day === day) last.items.push(item)
    else groups.push({ day, items: [item], total: 0, hiddenCount: 0 })
  }
  for (const group of groups) {
    const dayTotals = totals.get(group.day) ?? { total: 0, count: 0 }
    group.total = dayTotals.total
    group.hiddenCount = dayTotals.count - group.items.length
  }
  return groups
}
