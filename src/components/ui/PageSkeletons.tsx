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

/** Lista agrupada por día de Gastos/Ingresos. También la usan esas páginas
 * en el lugar de la lista mientras se recargan (p. ej. al cambiar de
 * período), ver `useIsReloadingPage`. */
export const MovementListSkeleton: FC = () => (
  <SkeletonPage>
    <DayGroup rows={2} />
    <DayGroup rows={1} />
    <DayGroup rows={2} />
  </SkeletonPage>
)

/** Filas simples (gastos fijos) para la misma situación. */
export const RowsSkeleton: FC<{ rows?: number }> = ({ rows = 5 }) => (
  <SkeletonPage>
    {Array.from({ length: rows }).map((_, index) => (
      <ListRow key={index} />
    ))}
  </SkeletonPage>
)

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
      {/* "Este mes": mismas tarjetas que el resumen del período. */}
      <Box>
        <SectionTitle w="30%" />
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

const Field = () => (
  <Stack spacing={2}>
    <Skeleton h="14px" w="90px" />
    <Skeleton h="40px" borderRadius="md" />
  </Stack>
)

/** Bloque "título + descripción + contenido" de las secciones de
 * Configuración. */
const SettingsSection = ({ children }: { children: ReactNode }) => (
  <Box>
    <SectionTitle w="180px" />
    <Skeleton h="14px" w="70%" mb={4} />
    {children}
  </Box>
)

/** Configuración: perfil, idioma, Gmail, notificaciones y bancos. */
const SettingsSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={8} maxW="lg">
      <SettingsSection>
        <Stack spacing={4}>
          <Field />
          <Field />
          <Field />
          <Skeleton h="40px" w="140px" borderRadius="md" />
        </Stack>
      </SettingsSection>
      <SettingsSection>
        <Skeleton h="32px" w="120px" borderRadius="md" />
      </SettingsSection>
      <SettingsSection>
        <Skeleton h="72px" borderRadius="md" />
      </SettingsSection>
      <SettingsSection>
        <Stack spacing={3}>
          <Skeleton h="24px" w="60%" />
          <Skeleton h="24px" w="50%" />
        </Stack>
      </SettingsSection>
      <SettingsSection>
        <Skeleton h="96px" borderRadius="md" />
      </SettingsSection>
    </Stack>
  </SkeletonPage>
)

/** Sección "Información personal" del perfil. Exportada: la vista la
 * muestra en vez de `null` hasta montar. */
export const ProfileInfoSkeleton: FC = () => (
  <SkeletonPage>
    <Box>
      <SectionTitle w="220px" />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field />
        <Field />
        <Field />
      </SimpleGrid>
      <Skeleton h="40px" w="120px" mt={4} borderRadius="md" />
    </Box>
  </SkeletonPage>
)

/** Sección "Seguridad" del perfil, mismo uso que `ProfileInfoSkeleton`. */
export const ProfileSecuritySkeleton: FC = () => (
  <SkeletonPage>
    <Box>
      <SectionTitle w="160px" />
      <Skeleton h="72px" borderRadius="md" />
    </Box>
  </SkeletonPage>
)

const ProfileSkeleton: FC = () => (
  <Stack spacing={10}>
    <ProfileInfoSkeleton />
    <ProfileSecuritySkeleton />
  </Stack>
)

/** Activar 2FA: título, instrucción, QR, código y acciones. */
const TwoFactorSetupSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={8} align="center" maxW="container.sm" mx="auto">
      <Skeleton h="36px" w="200px" />
      <Skeleton h="16px" w="70%" />
      <Skeleton boxSize="200px" borderRadius="md" />
      <Skeleton h="48px" w="260px" borderRadius="md" />
      <Flex justify="space-around" w="full">
        <Skeleton h="40px" w="130px" borderRadius="md" />
        <Skeleton h="40px" w="130px" borderRadius="md" />
      </Flex>
    </Stack>
  </SkeletonPage>
)

/** Calculadora: campo de monto, botón y las tarjetas de resultado. */
const BudgetCalculatorSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={6} maxW="container.sm" mx="auto" align="center">
      <Skeleton h="16px" w="140px" />
      <Skeleton h="48px" w="full" borderRadius="md" />
      <Skeleton h="40px" w="160px" borderRadius="md" />
      <Stack spacing={4} w="full" pt={4}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} h="96px" borderRadius="md" />
        ))}
      </Stack>
    </Stack>
  </SkeletonPage>
)

/** Metas: título y texto centrados. */
const GoalsSkeleton: FC = () => (
  <SkeletonPage>
    <Stack spacing={4} align="center" py={16}>
      <Skeleton h="36px" w="240px" />
      <Skeleton h="16px" w="320px" maxW="full" />
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
  '/settings': SettingsSkeleton,
  '/profile': ProfileSkeleton,
  '/profile/2fa': TwoFactorSetupSkeleton,
  '/goals': GoalsSkeleton,
  '/budget-calculator': BudgetCalculatorSkeleton
}

/**
 * Skeleton de la pantalla. Cualquier página con el layout de la app que no
 * esté en el mapa recibe uno genérico, así ninguna navegación queda sin
 * feedback. Las de `/auth/*` y `/profile/verify-2fa` no usan ese layout
 * (son estáticas, sin datos que esperar) y no llevan skeleton.
 */
const PAGES_WITHOUT_APP_LAYOUT = ['/auth/', '/profile/verify-2fa', '/500']

export const getPageSkeleton = (pathname: string): FC | null => {
  if (PAGES_WITHOUT_APP_LAYOUT.some(prefix => pathname.startsWith(prefix)))
    return null
  return PAGE_SKELETONS[pathname] ?? GenericSkeleton
}
