import {
  Box,
  Flex,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  useColorModeValue
} from '@chakra-ui/react'
import { FC, ReactNode } from 'react'

/**
 * Skeletons por pantalla, mostrados por `_app` mientras se navega hacia
 * ellas (ver `useRouteLoading`). Imitan la estructura real de cada página
 * para que, al llegar los datos, el contenido "se rellene" en su lugar en
 * vez de saltar. Puramente visuales: el aviso para lectores de pantalla lo
 * da `RouteProgress`.
 */

const SkeletonPage = ({ children }: { children: ReactNode }) => (
  <Box
    aria-hidden="true"
    sx={{
      '@media (prefers-reduced-motion: reduce)': {
        '.chakra-skeleton': { animation: 'none' }
      }
    }}
  >
    {children}
  </Box>
)

const PrimaryButton = () => (
  <Flex justify="flex-end">
    <Skeleton h="44px" w={{ base: 'full', md: '180px' }} borderRadius="md" />
  </Flex>
)

const SectionTitle = ({ w = '200px' }: { w?: string }) => (
  <Skeleton h="28px" w={w} mb={4} borderRadius="md" />
)

const Panel = ({ children }: { children: ReactNode }) => {
  const bg = useColorModeValue('gray.50', 'gray.700')
  return (
    <Box bg={bg} borderRadius="md" p={4}>
      {children}
    </Box>
  )
}

const Stats = ({ count }: { count: number }) => (
  <SimpleGrid columns={{ base: 2, sm: count }} spacingX={6} spacingY={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Stack key={index} spacing={2}>
        <Skeleton h="14px" w="70px" />
        <Skeleton h="24px" w="90px" />
      </Stack>
    ))}
  </SimpleGrid>
)

/** Fila de lista: concepto + línea secundaria a la izquierda, monto a la
 * derecha. */
const ListRow = () => {
  const borderColor = useColorModeValue('gray.100', 'gray.600')
  return (
    <Flex
      justify="space-between"
      align="center"
      gap={4}
      py={3}
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      <Stack spacing={2} flex="1">
        <Skeleton h="16px" w={{ base: '70%', md: '45%' }} />
        <Skeleton h="14px" w="90px" />
      </Stack>
      <Skeleton h="18px" w="60px" />
    </Flex>
  )
}

const DayGroup = ({ rows }: { rows: number }) => (
  <Box mb={4}>
    <Skeleton h="14px" w="110px" mb={2} />
    {Array.from({ length: rows }).map((_, index) => (
      <ListRow key={index} />
    ))}
  </Box>
)

/** Gastos e Ingresos: botón de alta, panel de filtros y lista por día. */
const MovementsSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={6}>
      <PrimaryButton />
      <Box>
        <SectionTitle w="160px" />
        <Panel>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            gap={4}
          >
            <Stack spacing={2} w={{ base: 'full', md: 'xs' }}>
              <Skeleton h="14px" w="60px" />
              <Skeleton h="40px" borderRadius="md" />
            </Stack>
            <Stats count={4} />
          </Flex>
          <Skeleton h="40px" mt={4} borderRadius="md" />
          <Flex gap={2} mt={3}>
            {[90, 70, 70].map((width, index) => (
              <Skeleton
                key={index}
                h="32px"
                w={`${width}px`}
                borderRadius="full"
              />
            ))}
          </Flex>
        </Panel>
        <Box mt={6}>
          <DayGroup rows={2} />
          <DayGroup rows={1} />
          <DayGroup rows={2} />
        </Box>
      </Box>
    </Stack>
  </SkeletonPage>
)

const FixedExpensesSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={6}>
      <PrimaryButton />
      <Box>
        <SectionTitle w="180px" />
        <Panel>
          <Stats count={3} />
        </Panel>
        <Box mt={4}>
          {Array.from({ length: 5 }).map((_, index) => (
            <ListRow key={index} />
          ))}
        </Box>
      </Box>
    </Stack>
  </SkeletonPage>
)

const DashboardSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={12}>
      <Box>
        <SectionTitle w="60%" />
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6} mt={6}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Stack key={index} align="center" spacing={3}>
              <SkeletonCircle size="28" />
              <Skeleton h="16px" w="90px" />
              <Skeleton h="14px" w="120px" />
            </Stack>
          ))}
        </SimpleGrid>
      </Box>
      <Box>
        <SectionTitle w="40%" />
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} h="120px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </Box>
      <Box>
        <SectionTitle w="35%" />
        {Array.from({ length: 5 }).map((_, index) => (
          <ListRow key={index} />
        ))}
      </Box>
    </Stack>
  </SkeletonPage>
)

/** Configuración, perfil y demás pantallas de formularios. */
const FormPageSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={8} maxW="lg">
      {Array.from({ length: 3 }).map((_, section) => (
        <Box key={section}>
          <SectionTitle w="160px" />
          <Stack spacing={4}>
            <Skeleton h="40px" borderRadius="md" />
            <Skeleton h="40px" borderRadius="md" />
          </Stack>
        </Box>
      ))}
    </Stack>
  </SkeletonPage>
)

const GenericSkeleton: FC = () => (
  <SkeletonPage>
    <SectionTitle />
    <SkeletonText noOfLines={6} spacing={4} skeletonHeight="3" />
  </SkeletonPage>
)

const PAGE_SKELETONS: Record<string, FC> = {
  '/dashboard': DashboardSkeleton,
  '/expenditures': MovementsSkeleton,
  '/entries': MovementsSkeleton,
  '/fixed-expenses': FixedExpensesSkeleton,
  '/settings': FormPageSkeleton,
  '/profile': FormPageSkeleton,
  '/profile/2fa': FormPageSkeleton,
  '/goals': GenericSkeleton,
  '/budget-calculator': FormPageSkeleton
}

/** Skeleton de la pantalla, o `null` si no corresponde (p. ej. las de
 * `/auth/*`, que no usan el layout con menú). */
export const getPageSkeleton = (pathname: string): FC | null =>
  PAGE_SKELETONS[pathname] ?? null
