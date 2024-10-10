import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import { Profile } from '@/interfaces'
import { localApiService } from '@/lib'
import { useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import React from 'react'

export const Security = ({ enable2FA }: Partial<Profile>) => {
  const router = useRouter()
  const { data } = useSession()
  const toast = useToast()
  const switchRoute = () => {
    router.push('/profile/2fa')
  }
  const desactivate2FA = () => {
    console.log('Desactivando 2FA')

    toast.promise(
      localApiService.request({
        method: 'GET',
        endPoint: '/proxy/disable-2fa',
        headers: {
          'x-lang': 'en',
          Authorization: `Bearer ${data?.accessToken}`
        }
      }),
      {
        success: () => {
          return { title: '2FA desactivated successfully', status: 'success' }
        },
        loading: {
          title: 'Desactivating 2FA'
        },
        error: () => {
          return { title: 'An error occurred', status: 'error' }
        }
      }
    )
  }

  const exectue2FA = () => {
    if (enable2FA) desactivate2FA()
    else switchRoute()
  }

  return (
    <CustomStat>
      <InfoLayout
        title="Security"
        onEdit={exectue2FA}
        buttonLabel={enable2FA ? 'Disable 2FA' : 'Enable 2FA'}
      >
        <InfoSection
          label="Two-Factor Authentication"
          value={enable2FA ? 'Enabled' : 'Disabled'}
          useBadge={true}
        />
      </InfoLayout>
    </CustomStat>
  )
}
