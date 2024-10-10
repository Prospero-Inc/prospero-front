import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import React from 'react'

import { Profile } from '../../../interfaces/profile.interface'

export const PersonalInformation = ({
  email,
  firstName,
  lastName,
  username
}: Partial<Profile>) => {
  return (
    <CustomStat>
      <InfoLayout title="User Information" onEdit={() => alert('Edit clicked')}>
        {/* Secciones de información reutilizando InfoSection */}
        <InfoSection label="Username" value={username} />
        <InfoSection label="First Name" value={firstName} />
        <InfoSection label="Last Name" value={lastName} />
        <InfoSection label="Email address" value={email} />
      </InfoLayout>
    </CustomStat>
  )
}
