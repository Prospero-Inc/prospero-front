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

/*
 * Redesigned screens (docs/diseno-mobile.html): the same cards, radii and
 * heights as the real page, on the same surfaces, so the content fills in
 * place. Bones use the design's track/line colors, not Chakra's grays.
 */

/** A placeholder bar on a design surface. */
const Bone = ({
  h,
  w = 'full',
  radius = '6px',
  onBrand = false,
  ...rest
}: {
  h: string
  w?: string | Record<string, string>
  radius?: string
  /** On the brand-colored hero: translucent white instead of gray. */
  onBrand?: boolean
  flexShrink?: number
  mt?: string
}) => (
  <Skeleton
    h={h}
    w={w}
    borderRadius={radius}
    startColor={onBrand ? 'whiteAlpha.300' : 'track.bg'}
    endColor={onBrand ? 'whiteAlpha.100' : 'border.subtle'}
    {...rest}
  />
)

/** White rounded card, as `.card` / `.list` / `.rev` / `.fx`. */
const Card = ({
  children,
  radius = '20px',
  p = '16px'
}: {
  children: ReactNode
  radius?: string
  p?: string
}) => (
  <Box bg="bg.surface" borderRadius={radius} p={p}>
    {children}
  </Box>
)

/** Title + subtitle lines, as in every list row. */
const TwoLines = ({ w = '60%' }: { w?: string }) => (
  <Stack spacing="7px" flex={1} minW={0}>
    <Bone h="14px" w={w} />
    <Bone h="11px" w="40%" />
  </Stack>
)

/** `.mrow`: 40 px icon box, two lines, amount. */
const MovementRowBone = ({ w }: { w?: string }) => (
  <Flex align="center" gap="12px" py="12px">
    <Bone h="40px" w="40px" radius="13px" flexShrink={0} />
    <TwoLines w={w} />
    <Bone h="14px" w="64px" flexShrink={0} />
  </Flex>
)

/** `.day`: 12 px uppercase group label. */
const GroupLabel = ({ w = '90px' }: { w?: string }) => (
  <Box px="2px" pt="4px">
    <Bone h="11px" w={w} />
  </Box>
)

const ScreenStack = ({ children }: { children: ReactNode }) => (
  <SkeletonPage>
    <Stack spacing="12px" maxW="lg" pb={4}>
      {children}
    </Stack>
  </SkeletonPage>
)

/** Inicio: hero, Gmail alert, split bars, latest movement. */
const DashboardSkeleton: FC = () => (
  <ScreenStack>
    <Box bg="hero.bg" borderRadius="24px" p="18px">
      <Bone onBrand h="13px" w="150px" />
      <Bone onBrand h="40px" w="190px" radius="10px" mt="10px" />
      <Bone onBrand h="13px" w="85%" mt="12px" />
      <Flex gap="8px" mt="16px">
        <Bone onBrand h="52px" radius="14px" />
        <Bone onBrand h="52px" radius="14px" />
      </Flex>
    </Box>
    <Box bg="status.pendingBg" borderRadius="16px" p="14px">
      <Flex align="center" gap="12px">
        <Bone h="36px" w="36px" radius="10px" flexShrink={0} />
        <TwoLines w="70%" />
        <Bone h="40px" w="84px" radius="12px" flexShrink={0} />
      </Flex>
    </Box>
    <Card>
      <Flex justify="space-between" mb="16px">
        <Bone h="15px" w="90px" />
        <Bone h="13px" w="70px" />
      </Flex>
      <Stack spacing="16px">
        {[0, 1, 2].map(index => (
          <Box key={index}>
            <Flex justify="space-between" mb="8px">
              <Bone h="13px" w="100px" />
              <Bone h="13px" w="110px" />
            </Flex>
            <Bone h="10px" radius="5px" />
          </Box>
        ))}
      </Stack>
    </Card>
    <Card p="16px 16px 4px">
      <Flex justify="space-between" mb="4px">
        <Bone h="15px" w="80px" />
        <Bone h="13px" w="60px" />
      </Flex>
      <MovementRowBone />
    </Card>
  </ScreenStack>
)

/** Movimientos: segmented control, chips and lists grouped by day. */
const MovementsListSkeleton: FC = () => (
  <ScreenStack>
    <Bone h="46px" radius="14px" />
    <Flex gap="8px">
      <Bone h="36px" w="110px" radius="18px" />
      <Bone h="36px" w="96px" radius="18px" />
      <Bone h="36px" w="86px" radius="18px" />
    </Flex>
    {[2, 3, 1].map((rows, group) => (
      <Stack key={group} spacing="12px">
        <GroupLabel w={group === 0 ? '50px' : '90px'} />
        <Card radius="20px" p="4px 14px">
          {Array.from({ length: rows }).map((_, index) => (
            <MovementRowBone key={index} w={index % 2 ? '45%' : '65%'} />
          ))}
        </Card>
      </Stack>
    ))}
  </ScreenStack>
)

/** Por revisar: progress and the `.rev` cards. */
const ReviewSkeleton: FC = () => (
  <ScreenStack>
    <Flex align="center" gap="10px">
      <Bone h="13px" w="110px" flexShrink={0} />
      <Bone h="6px" radius="3px" />
    </Flex>
    {[0, 1].map(index => (
      <Card key={index} p="14px">
        <Flex align="center" gap="12px">
          <Bone h="40px" w="40px" radius="12px" flexShrink={0} />
          <TwoLines w={index ? '70%' : '45%'} />
          <Bone h="16px" w="64px" flexShrink={0} />
        </Flex>
        <Bone h="11px" w="45%" mt="14px" />
        <Flex gap="8px" mt="10px">
          <Bone h="44px" radius="12px" />
          <Bone h="44px" radius="12px" />
          <Bone h="44px" radius="12px" />
        </Flex>
        <Flex justify="space-between" mt="14px" mb="4px">
          <Bone h="13px" w="70px" />
          <Bone h="13px" w="150px" />
        </Flex>
      </Card>
    ))}
  </ScreenStack>
)

/** `.fx`: date block, two lines, amount, "Pagar". */
const FixedRowBone = ({ w }: { w: string }) => (
  <Card radius="18px" p="12px 14px">
    <Flex align="center" gap="12px">
      <Stack spacing="5px" w="46px" align="center" flexShrink={0}>
        <Bone h="20px" w="26px" />
        <Bone h="10px" w="28px" />
      </Stack>
      <TwoLines w={w} />
      <Bone h="14px" w="58px" flexShrink={0} />
      <Bone h="40px" w="72px" radius="12px" flexShrink={0} />
    </Flex>
  </Card>
)

/** Fijos: summary with the paid bar, then "Por pagar" and "Pagados". */
const FixedExpensesSkeleton: FC = () => (
  <ScreenStack>
    <Card>
      <Flex justify="space-between" align="flex-end">
        <Stack spacing="8px">
          <Bone h="12px" w="130px" />
          <Bone h="24px" w="110px" />
        </Stack>
        <Stack spacing="8px" align="flex-end">
          <Bone h="12px" w="50px" />
          <Bone h="24px" w="100px" />
        </Stack>
      </Flex>
    </Card>
    <Box mt="-4px">
      <Bone h="8px" radius="5px" />
    </Box>
    <Box mt="6px">
      <GroupLabel w="80px" />
    </Box>
    <FixedRowBone w="55%" />
    <FixedRowBone w="45%" />
    <Box mt="6px">
      <GroupLabel w="70px" />
    </Box>
    <FixedRowBone w="50%" />
  </ScreenStack>
)

/** `.list` with `.li` rows: 32 px icon box and a label. */
const ListRowsBone = ({ widths }: { widths: string[] }) => (
  <Card radius="18px" p="0 14px">
    <Stack
      spacing={0}
      divider={<Box borderTopWidth="1px" borderColor="border.subtle" />}
    >
      {widths.map((w, index) => (
        <Flex key={index} align="center" gap="12px" h="56px">
          <Bone h="32px" w="32px" radius="10px" flexShrink={0} />
          <Bone h="14px" w={w} />
        </Flex>
      ))}
    </Stack>
  </Card>
)

/** Más: profile card and the grouped lists. */
const MoreSkeleton: FC = () => (
  <ScreenStack>
    <Card radius="18px" p="14px">
      <Flex align="center" gap="12px">
        <SkeletonCircle
          size="48px"
          startColor="track.bg"
          endColor="border.subtle"
        />
        <TwoLines w="45%" />
      </Flex>
    </Card>
    <GroupLabel w="100px" />
    <ListRowsBone widths={['45%', '40%']} />
    <GroupLabel w="70px" />
    <ListRowsBone widths={['40%', '65%']} />
    <GroupLabel w="110px" />
    <ListRowsBone widths={['25%', '35%']} />
    <ListRowsBone widths={['35%']} />
  </ScreenStack>
)

/** Perfil: avatar, the editable rows and the locked email. */
const ProfileSettingsSkeleton: FC = () => (
  <ScreenStack>
    <Flex direction="column" align="center" gap="10px" pt="6px" pb="4px">
      <SkeletonCircle
        size="72px"
        startColor="track.bg"
        endColor="border.subtle"
      />
      <Bone h="11px" w="150px" />
    </Flex>
    <ListRowsBone widths={['40%', '50%', '35%']} />
    <ListRowsBone widths={['60%']} />
  </ScreenStack>
)

/** Presupuesto: the two frequency cards and the split card. */
const BudgetSettingsSkeleton: FC = () => (
  <ScreenStack>
    <GroupLabel w="160px" />
    <Flex gap="10px">
      {['90px', '80px'].map(w => (
        <Box key={w} flex={1}>
          <Card radius="16px" p="14px">
            <Bone h="14px" w={w} />
            <Bone h="11px" w="70%" mt="8px" />
          </Card>
        </Box>
      ))}
    </Flex>
    <GroupLabel w="140px" />
    <Card radius="18px">
      <Stack spacing="18px">
        <Bone h="22px" radius="11px" />
        {['45%', '35%', '30%'].map(w => (
          <Flex key={w} align="center" justify="space-between">
            <Bone h="14px" w={w} />
            <Bone h="40px" w="140px" radius="12px" />
          </Flex>
        ))}
      </Stack>
    </Card>
  </ScreenStack>
)

/** Gmail y bancos, Notificaciones, Seguridad: a status card and lists. */
const SettingsListSkeleton: FC = () => (
  <ScreenStack>
    <Card radius="18px">
      <Flex align="center" gap="12px" mb="16px">
        <Bone h="44px" w="44px" radius="13px" flexShrink={0} />
        <TwoLines w="50%" />
      </Flex>
      <Bone h="44px" radius="13px" />
    </Card>
    <GroupLabel w="120px" />
    <ListRowsBone widths={['55%', '45%']} />
  </ScreenStack>
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
  '/movements': MovementsListSkeleton,
  '/review': ReviewSkeleton,
  '/more': MoreSkeleton,
  '/expenditures': MovementsSkeleton,
  '/entries': MovementsSkeleton,
  '/fixed-expenses': FixedExpensesSkeleton,
  '/settings/profile': ProfileSettingsSkeleton,
  '/settings/budget': BudgetSettingsSkeleton,
  '/settings/gmail': SettingsListSkeleton,
  '/settings/notifications': SettingsListSkeleton,
  '/settings/security': SettingsListSkeleton,
  '/profile/2fa': TwoFactorSetupSkeleton,
  '/goals': GoalsSkeleton,
  '/budget-calculator': BudgetCalculatorSkeleton
}

/**
 * Skeleton de la pantalla. Cualquier página con el layout de la app que no
 * esté en el mapa recibe uno genérico, así ninguna navegación queda sin
 * feedback. Sin skeleton: `/auth/*` y `/500`, que no usan ese layout (son
 * estáticas, sin datos que esperar), y `/profile/verify-2fa`, que solo
 * redirige a `/profile/2fa`.
 */
const PAGES_WITHOUT_APP_LAYOUT = ['/auth/', '/profile/verify-2fa', '/500']

export const getPageSkeleton = (pathname: string): FC | null => {
  if (PAGES_WITHOUT_APP_LAYOUT.some(prefix => pathname.startsWith(prefix)))
    return null
  return PAGE_SKELETONS[pathname] ?? GenericSkeleton
}
