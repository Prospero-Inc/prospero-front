'use client'
import { InfoLayout, InfoSection } from '@/components/layouts'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Stack,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Profile,
  UpdateProfileData
} from '../../../interfaces/profile.interface'

export const PersonalInformation = ({
  email,
  firstName,
  lastName,
  username
}: Partial<Profile>) => {
  const { t } = useTranslation('profile')
  const { data: session } = useSession()
  const toast = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentValues, setCurrentValues] = useState<UpdateProfileData>({
    firstName,
    lastName,
    username
  })
  const { control, handleSubmit, reset } = useForm<UpdateProfileData>({
    defaultValues: currentValues
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const startEditing = () => {
    reset(currentValues)
    setIsEditing(true)
  }

  const onSubmit = async (data: UpdateProfileData) => {
    setIsSaving(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/update-profile',
        method: HttpMethod.PATCH,
        data,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      setCurrentValues(data)
      setIsEditing(false)
      toast({
        title: t('userSection.toast.success.title'),
        description: t('userSection.toast.success.description'),
        status: 'success',
        isClosable: true
      })
    } catch (error) {
      toast({
        title: t('userSection.toast.error.title'),
        description: t('userSection.toast.error.description'),
        status: 'error',
        isClosable: true
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isMounted) return null

  if (isEditing)
    return (
      <Stack
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
      >
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <FormControl>
            <FormLabel>{t('userSection.username')}</FormLabel>
            <Controller
              name="username"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('userSection.firstName')}</FormLabel>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('userSection.lastName')}</FormLabel>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </FormControl>
        </Grid>
        <Stack direction="row" justify="flex-end">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            isDisabled={isSaving}
          >
            {t('userSection.buttonAction.cancel')}
          </Button>
          <Button colorScheme="primary" type="submit" isLoading={isSaving}>
            {t('userSection.buttonAction.save')}
          </Button>
        </Stack>
      </Stack>
    )

  return (
    <InfoLayout
      title={t('userSection.title')}
      onEdit={startEditing}
      buttonLabel={t('userSection.buttonAction.edit')}
    >
      <InfoSection
        label={t('userSection.username')}
        value={currentValues.username}
      />
      <InfoSection
        label={t('userSection.firstName')}
        value={currentValues.firstName}
      />
      <InfoSection
        label={t('userSection.lastName')}
        value={currentValues.lastName}
      />
      <InfoSection label={t('userSection.email')} value={email} />
    </InfoLayout>
  )
}
