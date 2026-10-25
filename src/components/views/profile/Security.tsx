'use client'
import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import { ProfileSecuritySkeleton } from '@/components/ui/PageSkeletons'
import { Profile } from '@/interfaces'
import { localApiService } from '@/lib'
import { useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const Security = ({ enable2FA }: Partial<Profile>) => {
  const { t } = useTranslation('profile')
  const router = useRouter()
  const { data } = useSession()
  const toast = useToast()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const switchRoute = () => {
    router.push('/profile/2fa')
  }
  const desactivate2FA = () => {
    // Desactivar 2FA baja la seguridad de la cuenta: pedir confirmación.
    if (!window.confirm(t('securitySection.disableConfirm'))) return

    toast.promise(
      localApiService.request({
        method: 'GET',
        endPoint: '/proxy/disable-2fa',
        headers: {
          'x-lang': router.locale ?? 'es',
          Authorization: `Bearer ${data?.accessToken}`
        }
      }),
      {
        success: () => {
          // Refresca el perfil para que el estado deje de decir "Activado".
          router.replace(router.asPath)
          return {
            title: t('securitySection.toast.disabled'),
            status: 'success'
          }
        },
        loading: {
          title: t('securitySection.toast.disabling')
        },
        error: () => {
          return { title: t('securitySection.toast.error'), status: 'error' }
        }
      }
    )
  }

  const exectue2FA = () => {
    if (enable2FA) desactivate2FA()
    else switchRoute()
  }

  // Asegurarse de que el contenido solo se renderice en el cliente
  // Hasta montar se muestra la forma de la sección en vez de nada: antes
  // la página aparecía vacía y el contenido "saltaba" al hidratar.
  if (!mounted) return <ProfileSecuritySkeleton />

  return (
    <CustomStat>
      <InfoLayout
        title={t('securitySection.title')}
        onEdit={exectue2FA}
        buttonLabel={t(
          `securitySection.buttonAction.${enable2FA ? 'disable' : 'enable'}`
        )}
      >
        <InfoSection
          label={t('securitySection.twoFactorAuth')}
          value={t(`securitySection.${enable2FA ? 'enabled' : 'disabled'}`)}
          useBadge={true}
        />
      </InfoLayout>
    </CustomStat>
  )
}
