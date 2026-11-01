import { ProsperoLayout } from '@/components/layouts'
import type { TopBarAction } from '@/components/layouts/shell/AppShellTitle'
import { getPageSkeleton } from '@/components/ui/PageSkeletons'
import { Box, Stack } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'

interface SettingsLayoutProps {
  title: string
  /** Text action on the right of the top bar ("Guardar"). */
  action?: TopBarAction | null
  /** Where "‹ …" goes back to; "Más" by default. */
  back?: { href: string; label: string }
  /** Data still loading: show the screen's skeleton. */
  isLoading?: boolean
  /** Fixed at thumb height on phones (design .bottom-cta). */
  bottomCta?: ReactNode
  children: ReactNode
}

/**
 * One settings screen (docs/diseno-mobile.html, 06–09): its own title with
 * "‹ Más" in the top bar, no tab bar, and the cards stacked 12 px apart.
 */
export const SettingsLayout = ({
  title,
  action,
  back,
  isLoading = false,
  bottomCta,
  children
}: SettingsLayoutProps) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const PageSkeleton = getPageSkeleton(router.pathname)

  return (
    <ProsperoLayout
      title={title}
      pageDescription={title}
      topBarTrailing={action ? { action } : 'none'}
      topBarBack={back ?? { href: '/more', label: t('more.title') }}
    >
      {isLoading && PageSkeleton ? (
        <PageSkeleton />
      ) : (
        <Stack
          spacing="12px"
          maxW="lg"
          pb={{
            base: bottomCta ? 'calc(96px + env(safe-area-inset-bottom))' : 6,
            md: 6
          }}
        >
          {children}
          {bottomCta && (
            <Box
              position={{ base: 'fixed', md: 'static' }}
              left="16px"
              right="16px"
              bottom="calc(24px + env(safe-area-inset-bottom))"
              zIndex="docked"
              pt={{ base: 0, md: 2 }}
            >
              {bottomCta}
            </Box>
          )}
        </Stack>
      )}
    </ProsperoLayout>
  )
}
