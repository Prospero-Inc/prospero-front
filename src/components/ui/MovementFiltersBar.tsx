import { MovementFilters, SourceFilter } from '@/lib/movementFilters'
import { PeriodSummary } from '@/services/periods'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { MdSearch } from 'react-icons/md'

export interface MovementGroupOption {
  value: string
  label: string
}

export interface PeriodStatItem {
  label: string
  value: string
}

interface MovementFiltersBarProps {
  periods: PeriodSummary[]
  /** `undefined` = período actual. */
  selectedPeriod: string | undefined
  onPeriodChange: (_period: string | undefined) => void
  stats: PeriodStatItem[]
  filters: MovementFilters
  searchInput: string
  onSearchInputChange: (_value: string) => void
  onFiltersChange: (_filters: MovementFilters) => void
  groupsLabel: string
  groupOptions: MovementGroupOption[]
}

/** Etiqueta legible de un período: "10 oct – 23 oct", "Actual · desde 10
 * oct"… `timeZone: 'UTC'` por el mismo motivo que en `MovementSummary`. */
const usePeriodLabel = () => {
  const { t } = useTranslation('common', { keyPrefix: 'movementFilters' })
  const { locale } = useRouter()
  const formatter = new Intl.DateTimeFormat(locale ?? 'es', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
  const format = (date: string) => formatter.format(new Date(date))

  return (period: PeriodSummary): string => {
    if (period.startDate && period.isOpen)
      return t('periodCurrent', { start: format(period.startDate) })
    if (period.startDate && period.endDate)
      return t('periodRange', {
        start: format(period.startDate),
        end: format(period.endDate)
      })
    if (period.endDate)
      return t('periodInitial', { end: format(period.endDate) })
    // Sin ninguna nómina registrada hay un único período sin límites.
    return t('periodAll')
  }
}

export const MovementFiltersBar = ({
  periods,
  selectedPeriod,
  onPeriodChange,
  stats,
  filters,
  searchInput,
  onSearchInputChange,
  onFiltersChange,
  groupsLabel,
  groupOptions
}: MovementFiltersBarProps) => {
  const { t } = useTranslation('common', { keyPrefix: 'movementFilters' })
  const periodLabel = usePeriodLabel()
  const panelBg = useColorModeValue('gray.50', 'gray.700')
  const mutedColor = useColorModeValue('gray.600', 'gray.300')
  const fieldBg = useColorModeValue('white', 'gray.800')
  const currentKey = periods.find(period => period.isOpen)?.key

  const toggleGroup = (value: string) =>
    onFiltersChange({
      ...filters,
      groups: filters.groups.includes(value)
        ? filters.groups.filter(group => group !== value)
        : [...filters.groups, value]
    })

  return (
    <Box bg={panelBg} borderRadius="md" p={4}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        align={{ base: 'stretch', md: 'flex-end' }}
        justify="space-between"
      >
        <FormControl maxW={{ md: 'xs' }}>
          <FormLabel fontSize="sm">{t('periodLabel')}</FormLabel>
          <Select
            value={selectedPeriod ?? currentKey ?? ''}
            onChange={e =>
              onPeriodChange(
                e.target.value === currentKey ? undefined : e.target.value
              )
            }
          >
            {periods.map(period => (
              <option key={period.key} value={period.key}>
                {periodLabel(period)}
              </option>
            ))}
          </Select>
        </FormControl>

        <SimpleGrid
          columns={{ base: Math.min(stats.length, 2), sm: stats.length }}
          spacingX={6}
          spacingY={3}
        >
          {stats.map(stat => (
            <Stat key={stat.label}>
              <StatLabel color={mutedColor}>{stat.label}</StatLabel>
              <StatNumber fontSize="xl">{stat.value}</StatNumber>
            </Stat>
          ))}
        </SimpleGrid>
      </Flex>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        mt={4}
        align={{ base: 'stretch', md: 'center' }}
      >
        <InputGroup flex="1">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" aria-hidden="true" />
          </InputLeftElement>
          <Input
            type="search"
            aria-label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={e => onSearchInputChange(e.target.value)}
            bg={fieldBg}
          />
        </InputGroup>
        <Select
          aria-label={t('sourceLabel')}
          w={{ md: 'auto' }}
          flexShrink={0}
          value={filters.source}
          onChange={e =>
            onFiltersChange({
              ...filters,
              source: e.target.value as SourceFilter
            })
          }
          bg={fieldBg}
        >
          <option value="all">{t('source.all')}</option>
          <option value="Manual">{t('source.Manual')}</option>
          <option value="Gmail">{t('source.Gmail')}</option>
        </Select>
      </Flex>

      <Flex mt={3} align="center" gap={2} wrap="wrap">
        <Text fontSize="sm" color={mutedColor} id="movement-groups-label">
          {groupsLabel}:
        </Text>
        <Wrap spacing={2} role="group" aria-labelledby="movement-groups-label">
          {groupOptions.map(option => {
            const isSelected = filters.groups.includes(option.value)
            return (
              <WrapItem key={option.value}>
                <Button
                  size="sm"
                  minH={{ base: '44px', md: '32px' }}
                  borderRadius="full"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorScheme={isSelected ? 'primary' : 'gray'}
                  aria-pressed={isSelected}
                  onClick={() => toggleGroup(option.value)}
                >
                  {option.label}
                </Button>
              </WrapItem>
            )
          })}
        </Wrap>
      </Flex>
    </Box>
  )
}

interface FilterResultsProps {
  shown: number
  total: number
  isFiltering: boolean
  onClear: () => void
  /** Texto cuando el período no tiene ningún movimiento. */
  emptyPeriodText: string
}

/** "Mostrando 3 de 12 · Limpiar filtros" y los dos estados vacíos: período
 * sin movimientos vs. filtros que no encuentran nada (este último siempre
 * ofrece salir con un clic). Devuelve `null` si no hay nada que decir. */
export const FilterResults = ({
  shown,
  total,
  isFiltering,
  onClear,
  emptyPeriodText
}: FilterResultsProps) => {
  const { t } = useTranslation('common', { keyPrefix: 'movementFilters' })
  const mutedColor = useColorModeValue('gray.600', 'gray.400')

  if (total === 0)
    return (
      <Text color={mutedColor} py={6} textAlign="center">
        {emptyPeriodText}
      </Text>
    )

  if (!isFiltering) return null

  if (shown === 0)
    return (
      <Flex direction="column" align="center" gap={2} py={6}>
        <Text color={mutedColor}>{t('noMatches')}</Text>
        <Button size="sm" variant="outline" onClick={onClear}>
          {t('clear')}
        </Button>
      </Flex>
    )

  return (
    <Flex align="center" gap={2} mb={2} role="status">
      <Text fontSize="sm" color={mutedColor}>
        {t('showing', { shown, total })}
      </Text>
      <Button size="sm" variant="link" onClick={onClear}>
        {t('clear')}
      </Button>
    </Flex>
  )
}
