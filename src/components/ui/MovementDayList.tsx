import { useMovementFormatters } from '@/components/ui/MovementSummary'
import { groupByDay } from '@/lib/movementGroups'
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'

export const MOVEMENTS_PAGE_SIZE = 25

interface MovementDayListProps<T> {
  /** Lista ya filtrada y ordenada del más reciente al más antiguo. */
  items: T[]
  getKey: (_item: T) => number
  getDate: (_item: T) => string
  getAmount: (_item: T) => number
  /** Fila de encabezado de la tabla desktop (`<Tr>` con sus `<Th>`). */
  tableHead: ReactNode
  columnCount: number
  renderTableRow: (_item: T) => ReactNode
  renderCard: (_item: T) => ReactNode
  /** Cuando cambia (filtros, período), se vuelve a mostrar solo la primera
   * tanda: seguir mostrando 75 filas de una búsqueda vieja no tiene sentido. */
  resetKey: string
}

/** "sáb, 12 oct", y el año solo si no es el actual. Mismo `timeZone: 'UTC'`
 * que el resto de los formateadores para que SSR y navegador coincidan. */
const useDayLabel = () => {
  const { locale } = useRouter()
  const currentYear = new Date().getUTCFullYear()
  return (day: string) => {
    const date = new Date(`${day}T00:00:00.000Z`)
    return new Intl.DateTimeFormat(locale ?? 'es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(date.getUTCFullYear() !== currentYear && { year: 'numeric' }),
      timeZone: 'UTC'
    }).format(date)
  }
}

/**
 * Listado de movimientos agrupado por día con "Mostrar más" progresivo.
 * Se eligió esto en vez de paginación numerada: la búsqueda y los totales
 * operan sobre todo el período (no sobre "la página 2"), en mobile no hay
 * botones diminutos y el usuario no pierde su lugar al ver más.
 */
export const MovementDayList = <T,>({
  items,
  getKey,
  getDate,
  getAmount,
  tableHead,
  columnCount,
  renderTableRow,
  renderCard,
  resetKey
}: MovementDayListProps<T>) => {
  const { t } = useTranslation('common', { keyPrefix: 'movementList' })
  const { formatAmount } = useMovementFormatters()
  const dayLabel = useDayLabel()
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const [limit, setLimit] = useState(MOVEMENTS_PAGE_SIZE)

  useEffect(() => setLimit(MOVEMENTS_PAGE_SIZE), [resetKey])

  // Si el corte del "Mostrar más" parte un día, el total sigue siendo el del
  // día completo; se aclara para que no parezca un descuadre.
  const dayTotal = (total: number, hiddenCount: number) =>
    hiddenCount > 0
      ? t('dayTotalPartial', {
          total: formatAmount(total),
          count: hiddenCount
        })
      : formatAmount(total)

  const visible = items.slice(0, limit)
  const groups = groupByDay(visible, items, getDate, getAmount)
  const remaining = items.length - visible.length

  return (
    <>
      {/* Desktop/tablet: una <Tbody> por día con su encabezado */}
      <TableContainer display={{ base: 'none', md: 'block' }}>
        <Table variant="simple" size="sm">
          <Thead>{tableHead}</Thead>
          {groups.map(group => (
            <Tbody key={group.day}>
              <Tr bg={headerBg}>
                <Th
                  colSpan={columnCount}
                  scope="colgroup"
                  textTransform="none"
                  letterSpacing="normal"
                  fontSize="sm"
                >
                  <Flex justify="space-between">
                    <time dateTime={group.day}>{dayLabel(group.day)}</time>
                    <Text as="span" color={mutedColor}>
                      {dayTotal(group.total, group.hiddenCount)}
                    </Text>
                  </Flex>
                </Th>
              </Tr>
              {group.items.map(renderTableRow)}
            </Tbody>
          ))}
        </Table>
      </TableContainer>

      {/* Mobile: una sección por día con sus cards */}
      <Stack spacing={5} display={{ base: 'flex', md: 'none' }}>
        {groups.map(group => (
          <Box as="section" key={group.day} aria-label={dayLabel(group.day)}>
            <Flex justify="space-between" align="baseline" mb={2}>
              <Heading as="h3" size="xs">
                <time dateTime={group.day}>{dayLabel(group.day)}</time>
              </Heading>
              <Text fontSize="sm" color={mutedColor}>
                {dayTotal(group.total, group.hiddenCount)}
              </Text>
            </Flex>
            <Stack spacing={3}>
              {group.items.map(item => (
                <Box key={getKey(item)}>{renderCard(item)}</Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      {remaining > 0 && (
        <Flex direction="column" align="center" gap={2} mt={6}>
          <Text fontSize="sm" color={mutedColor} role="status">
            {t('showing', { shown: visible.length, total: items.length })}
          </Text>
          <Button
            variant="outline"
            minH="44px"
            onClick={() => setLimit(current => current + MOVEMENTS_PAGE_SIZE)}
          >
            {t('loadMore', {
              count: Math.min(MOVEMENTS_PAGE_SIZE, remaining),
              remaining
            })}
          </Button>
        </Flex>
      )}
    </>
  )
}
