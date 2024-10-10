import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import { Profile } from '@/interfaces'
import { useRouter } from 'next/router'
import React from 'react'

export const Security = ({ enable2FA }: Partial<Profile>) => {
  const router = useRouter()

  const switchRoute = () => {
    router.push('/profile/2fa')
  }

  return (
    <CustomStat>
      <InfoLayout title="Security" onEdit={switchRoute}>
        <InfoSection
          label="Two-Factor Authentication"
          value={enable2FA ? 'Enabled' : 'Disabled'}
          useBadge={true}
        />
      </InfoLayout>
    </CustomStat>
  )
}
