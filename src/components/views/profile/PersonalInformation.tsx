import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Profile } from '../../../interfaces/profile.interface'

export const PersonalInformation = ({
  email,
  firstName,
  lastName,
  username
}: Partial<Profile>) => {
  const { t } = useTranslation('profile')
  return (
    <CustomStat>
      <InfoLayout
        title={t('userSection.title')}
        onEdit={() => alert('Edit clicked')}
        buttonLabel={t('userSection.buttonAction.edit')}
      >
        {/* Secciones de información reutilizando InfoSection */}
        <InfoSection label={t('userSection.username')} value={username} />
        <InfoSection label={t('userSection.firstName')} value={firstName} />
        <InfoSection label={t('userSection.lastName')} value={lastName} />
        <InfoSection label={t('userSection.email')} value={email} />
      </InfoLayout>
    </CustomStat>
  )
}
