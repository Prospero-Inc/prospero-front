import { MovementSource } from '@/services/transactions'
import { ParsedUrlQuery } from 'querystring'

/** Filtros del lado del cliente de los listados de Gastos/Ingresos. El
 * período no está acá: lo resuelve el backend (`?period=`) porque depende de
 * `periodOverride`, que el frontend no debe reimplementar. */
export type SourceFilter = 'all' | MovementSource

export interface MovementFilters {
  search: string
  /** Categorías (Gastos) o tipos de ingreso (Ingresos) seleccionados; vacío =
   * todos. */
  groups: string[]
  source: SourceFilter
}

export const EMPTY_MOVEMENT_FILTERS: MovementFilters = {
  search: '',
  groups: [],
  source: 'all'
}

/** Lo mínimo que cada página extrae de sus filas para poder filtrarlas. */
export interface FilterableMovement {
  concept: string
  amount: number
  group: string | null
  source: MovementSource
}

const SOURCES: readonly SourceFilter[] = ['all', 'Manual', 'Gmail']

// Marcas diacríticas combinantes que deja `normalize('NFD')` (U+0300–U+036F).
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Minúsculas y sin tildes: "farmacia" encuentra "Farmacía". */
const normalize = (text: string): string =>
  text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()

export const hasActiveMovementFilters = (filters: MovementFilters): boolean =>
  filters.search.trim() !== '' ||
  filters.groups.length > 0 ||
  filters.source !== 'all'

export const matchesMovementFilters = (
  movement: FilterableMovement,
  filters: MovementFilters
): boolean => {
  const search = normalize(filters.search)
  // También por monto: escribir "15" encuentra un gasto de 15.00.
  const matchesSearch =
    !search ||
    normalize(movement.concept).includes(search) ||
    movement.amount.toFixed(2).includes(search)
  const matchesGroup =
    filters.groups.length === 0 ||
    (movement.group !== null && filters.groups.includes(movement.group))
  const matchesSource =
    filters.source === 'all' || movement.source === filters.source

  return matchesSearch && matchesGroup && matchesSource
}

const firstValue = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? ''

/** Lee los filtros de la URL descartando valores desconocidos, para que un
 * link viejo o editado a mano nunca deje la vista en un estado imposible. */
export const parseMovementFilters = (
  query: ParsedUrlQuery,
  allowedGroups: readonly string[]
): MovementFilters => {
  const source = firstValue(query.source) as SourceFilter
  return {
    search: firstValue(query.q),
    groups: firstValue(query.groups)
      .split(',')
      .filter(group => allowedGroups.includes(group)),
    source: SOURCES.includes(source) ? source : 'all'
  }
}

/** Inverso de `parseMovementFilters`; omite los valores por defecto para que
 * la URL quede limpia. */
export const toMovementFiltersQuery = (
  filters: MovementFilters
): Record<string, string> => ({
  ...(filters.search.trim() && { q: filters.search.trim() }),
  ...(filters.groups.length > 0 && { groups: filters.groups.join(',') }),
  ...(filters.source !== 'all' && { source: filters.source })
})
