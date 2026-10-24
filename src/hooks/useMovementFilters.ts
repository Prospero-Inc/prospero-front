import {
  EMPTY_MOVEMENT_FILTERS,
  MovementFilters,
  parseMovementFilters,
  toMovementFiltersQuery
} from '@/lib/movementFilters'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'

const SEARCH_DEBOUNCE_MS = 300

/**
 * La URL es la fuente de verdad de los filtros (sobreviven a recargar, al
 * botón atrás y a `router.replace(router.asPath)` después de guardar).
 * - Filtros del cliente → `replace` shallow: no vuelve a correr
 *   `getServerSideProps`.
 * - Período → `push` normal: sí lo vuelve a correr, porque las filas del
 *   período las trae el backend.
 */
export const useMovementFilters = (allowedGroups: readonly string[]) => {
  const router = useRouter()
  const filters = useMemo(
    () => parseMovementFilters(router.query, allowedGroups),
    [router.query, allowedGroups]
  )
  const period =
    typeof router.query.period === 'string' ? router.query.period : undefined

  // La búsqueda se tipea en un estado local y se sube a la URL con debounce,
  // para no reescribir el historial en cada tecla.
  const [searchInput, setSearchInput] = useState(filters.search)

  // `nextPeriod` es obligatorio a propósito: con un valor por defecto,
  // pasar `undefined` (= volver al período actual) caía en el default y
  // dejaba la URL en el período anterior.
  const buildQuery = (
    next: MovementFilters,
    nextPeriod: string | undefined
  ) => ({
    ...(nextPeriod && { period: nextPeriod }),
    ...toMovementFiltersQuery(next)
  })

  const setFilters = (next: MovementFilters) =>
    router.replace(
      { pathname: router.pathname, query: buildQuery(next, period) },
      undefined,
      { shallow: true, scroll: false }
    )

  // El debounce vive en el handler (no en un efecto sobre `searchInput`) y
  // lee los filtros vigentes al dispararse: si no, un "Limpiar filtros"
  // hecho durante la espera se pisaba con los filtros viejos.
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const latest = useRef({ filters, setFilters })
  latest.current = { filters, setFilters }
  useEffect(() => () => clearTimeout(searchTimeout.current), [])

  const changeSearch = (value: string) => {
    setSearchInput(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(
      () =>
        latest.current.setFilters({
          ...latest.current.filters,
          search: value
        }),
      SEARCH_DEBOUNCE_MS
    )
  }

  // Si la URL cambia por fuera (atrás/adelante, "Limpiar filtros"), el input
  // la sigue.
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  return {
    filters,
    period,
    searchInput,
    setSearchInput: changeSearch,
    setFilters,
    clearFilters: () => {
      clearTimeout(searchTimeout.current)
      setSearchInput('')
      return setFilters(EMPTY_MOVEMENT_FILTERS)
    },
    setPeriod: (nextPeriod: string | undefined) =>
      router.push(
        { pathname: router.pathname, query: buildQuery(filters, nextPeriod) },
        undefined,
        { scroll: false }
      )
  }
}
