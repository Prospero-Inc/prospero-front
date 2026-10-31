import { CATEGORY_COLORS } from '@/components/ui/CategoryBudgetBars'
import { formatMoney } from '@/lib/formatMoney'
import { BudgetCategory } from '@/services/transactions'
import {
  Badge,
  Box,
  Flex,
  Icon,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ReactNode, useMemo } from 'react'
import { MdMail } from 'react-icons/md'

/** Formateadores de fecha y monto para los listados de Gastos/Ingresos.
 * `timeZone: 'UTC'` por el mismo motivo que en `RecentActivityList`: las
 * fechas llegan como medianoche UTC y SSR (UTC) y navegador (UTC-6) tienen
 * que formatear el mismo día para no romper la hidratación. */
export const useMovementFormatters = () => {
  const { locale } = useRouter()

  return useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(locale ?? 'es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    })

    return {
      formatDate: (date: string) => dateFormatter.format(new Date(date)),
      formatAmount: (amount: number) => formatMoney(Math.abs(amount), locale)
    }
  }, [locale])
}

/** Badge de categoría con el mismo color que las barras del dashboard. El
 * texto siempre acompaña al color (WCAG 1.4.1). */
export const CategoryBadge = ({
  category,
  label
}: {
  category: BudgetCategory
  label: string
}) => (
  <Badge
    colorScheme={
      CATEGORY_COLORS[category.toLowerCase() as keyof typeof CATEGORY_COLORS]
    }
    variant="subtle"
  >
    {label}
  </Badge>
)

/** Indica que el movimiento lo detectó Gmail; el banco, si se conoce. */
export const GmailSourceBadge = ({ label }: { label: string }) => (
  <Badge
    colorScheme="gray"
    variant="outline"
    display="inline-flex"
    alignItems="center"
    gap={1}
    textTransform="none"
    fontWeight="medium"
  >
    <Icon as={MdMail} aria-hidden="true" />
    {label}
  </Badge>
)

interface MovementSummaryProps {
  /** Concepto escrito por el usuario (o derivado, p. ej. el gasto fijo). */
  title: string | null
  /** Se muestra atenuado cuando no hay `title`. */
  fallbackTitle: string
  date: string
  /** `false` dentro de un listado agrupado por día, donde el encabezado del
   * grupo ya dice la fecha. */
  showDate?: boolean
  badges?: ReactNode
}

/** Bloque "qué fue esto": concepto como foco principal, fecha como dato
 * secundario y badges de contexto debajo. Compartido por la tabla desktop
 * y las cards mobile de Gastos e Ingresos. */
export const MovementSummary = ({
  title,
  fallbackTitle,
  date,
  showDate = true,
  badges
}: MovementSummaryProps) => {
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const { formatDate } = useMovementFormatters()

  return (
    <Box minW={0}>
      <Text
        fontWeight={title ? 'semibold' : 'normal'}
        fontStyle={title ? 'normal' : 'italic'}
        color={title ? undefined : mutedColor}
        noOfLines={1}
        title={title ?? undefined}
      >
        {title ?? fallbackTitle}
      </Text>
      {showDate && (
        <Text fontSize="sm" color={mutedColor}>
          <time dateTime={date.slice(0, 10)}>{formatDate(date)}</time>
        </Text>
      )}
      {badges && (
        <Flex gap={1} mt={1} wrap="wrap">
          {badges}
        </Flex>
      )}
    </Box>
  )
}
