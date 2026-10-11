import {
  Card,
  CardBody,
  Heading,
  Icon,
  SkeletonCircle,
  SkeletonText,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { IconType } from 'react-icons'

export type DashboardSummaryAccent = 'teal' | 'red' | 'primary'

interface DashboardSummaryCardProps {
  label: string
  amount: number
  helpText?: string
  icon: IconType
  accent: DashboardSummaryAccent
}

/** `-$120.00`, nunca `$-120.00` — el signo va antes del símbolo de moneda. */
export const formatSignedCurrency = (value: number): string => {
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

export const DashboardSummaryCard = ({
  label,
  amount,
  helpText,
  icon,
  accent
}: DashboardSummaryCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderLeftColor = useColorModeValue(`${accent}.500`, `${accent}.300`)
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.300`)
  const labelColor = useColorModeValue('gray.600', 'gray.400')
  const helpTextColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Card
      variant="outline"
      bg={cardBg}
      borderLeftWidth="4px"
      borderLeftColor={borderLeftColor}
    >
      <CardBody>
        <Icon
          as={icon}
          boxSize={5}
          color={iconColor}
          aria-hidden="true"
          mb={2}
        />
        <Text fontSize="sm" color={labelColor} mb={1}>
          {label}
        </Text>
        <Heading fontSize={{ base: '2xl', md: '3xl' }}>
          {formatSignedCurrency(amount)}
        </Heading>
        {helpText && (
          <Text fontSize="xs" color={helpTextColor} mt={2}>
            {helpText}
          </Text>
        )}
      </CardBody>
    </Card>
  )
}

/** Para un futuro refresh client-side; el SSR actual nunca entra en estado
 * de carga para esta sección, pero se deja listo el placeholder. */
export const DashboardSummaryCardSkeleton = () => (
  <Card variant="outline">
    <CardBody>
      <SkeletonCircle size="5" mb={2} />
      <SkeletonText noOfLines={1} width="60%" mb={2} />
      <SkeletonText noOfLines={1} width="40%" skeletonHeight="8" />
    </CardBody>
  </Card>
)
