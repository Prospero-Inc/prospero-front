import {
  Chevron,
  FieldRow,
  Help,
  IconBox,
  ListCard,
  ListRow
} from '@/components/design/settings'
import { LockIcon, ShieldIcon } from '@/components/icons/app'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { settingsStaticProps } from '@/components/settings/settingsStaticProps'
import { HttpMethod } from '@/enums'
import { useIsOnline } from '@/hooks/useIsOnline'
import type { Profile, UpdateProfileData } from '@/interfaces'
import { localApiService } from '@/lib'
import { useApi, useRevalidateApi } from '@/lib/useApi'
import { Avatar, Box, Flex, Input, Text, useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { type FormEvent, useEffect, useState } from 'react'

const FORM_ID = 'profile-form'
const FIELDS = ['firstName', 'lastName', 'username'] as const
type Field = (typeof FIELDS)[number]
type Values = Record<Field, string>

const AUTOCOMPLETE: Record<Field, string> = {
  firstName: 'given-name',
  lastName: 'family-name',
  username: 'username'
}

const valuesOf = (profile?: Profile): Values => ({
  firstName: profile?.firstName ?? '',
  lastName: profile?.lastName ?? '',
  username: profile?.username ?? ''
})

/**
 * Perfil (docs/diseno-mobile.html, 07): name, last name and username edited
 * in place; the email is shown locked. "Guardar" appears in the top bar
 * only when something changed.
 */
export default function ProfileSettingsPage() {
  const { t } = useTranslation('settings')
  const { locale } = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const revalidateApi = useRevalidateApi()
  const isOnline = useIsOnline()
  const { data, error } = useApi<{ user: Profile }>('auth/profile')
  const profile = data?.user

  const [values, setValues] = useState<Values>(valuesOf())
  const [isSaving, setIsSaving] = useState(false)
  // Fill the form once the profile arrives (and again after saving).
  useEffect(() => {
    if (profile) setValues(valuesOf(profile))
  }, [profile])

  const changed = FIELDS.filter(
    field => values[field].trim() !== valuesOf(profile)[field]
  )
  const isValid = FIELDS.every(field => values[field].trim() !== '')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!changed.length || !isValid) return
    setIsSaving(true)
    try {
      const update: UpdateProfileData = Object.fromEntries(
        changed.map(field => [field, values[field].trim()])
      )
      await localApiService.request({
        endPoint: '/proxy/update-profile',
        method: HttpMethod.PATCH,
        data: update,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      await revalidateApi('auth/profile')
      toast({ title: t('profile.saved'), status: 'success' })
    } catch (saveError) {
      toast({
        title: t('profile.error'),
        description: saveError instanceof Error ? saveError.message : undefined,
        status: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : ''
  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric'
      }).format(new Date(profile.createdAt))
    : null

  return (
    <SettingsLayout
      title={t('profile.title')}
      isLoading={data === undefined && !error}
      action={
        changed.length
          ? {
              label: t('save'),
              form: FORM_ID,
              isDisabled: !isValid || !isOnline,
              isLoading: isSaving
            }
          : null
      }
    >
      <Flex direction="column" align="center" gap="8px" pt="6px" pb="4px">
        <Avatar
          name={fullName || undefined}
          boxSize="72px"
          bg="brand.subtle"
          color="brand.text"
          fontWeight="bold"
          sx={{ '& > div': { fontSize: '24px' } }}
        />
        {memberSince && (
          <Text fontSize="12.5px" color="text.secondary">
            {t('profile.memberSince', { date: memberSince })}
          </Text>
        )}
      </Flex>

      <Box as="form" id={FORM_ID} method="post" onSubmit={onSubmit}>
        <ListCard py="4px">
          {FIELDS.map(field => (
            <FieldRow
              key={field}
              label={t(`profile.${field}`)}
              htmlFor={`profile-${field}`}
            >
              <Input
                id={`profile-${field}`}
                name={field}
                variant="unstyled"
                autoComplete={AUTOCOMPLETE[field]}
                autoCapitalize={field === 'username' ? 'none' : 'words'}
                spellCheck={false}
                value={values[field]}
                onChange={event =>
                  setValues(current => ({
                    ...current,
                    [field]: event.target.value
                  }))
                }
                isInvalid={values[field].trim() === ''}
                flex={1}
                minW={0}
                h="44px"
                fontSize="16px"
                fontWeight={600}
                color="text.primary"
              />
            </FieldRow>
          ))}
        </ListCard>
      </Box>

      <ListCard py="4px">
        <FieldRow label={t('profile.email')}>
          <Text
            flex={1}
            minW={0}
            noOfLines={1}
            fontWeight={500}
            color="text.secondary"
          >
            {profile?.email}
          </Text>
          <LockIcon boxSize="16px" color="icon.subtle" aria-hidden />
        </FieldRow>
      </ListCard>
      <Help>{t('profile.emailHelp')}</Help>

      <Box mt="6px">
        <ListCard>
          <ListRow
            href="/settings/security"
            icon={<IconBox icon={<ShieldIcon boxSize="18px" />} />}
            label={t('profile.security')}
            value={
              <>
                {profile &&
                  t(profile.enable2FA ? 'security.on' : 'security.off')}
                <Chevron />
              </>
            }
          />
        </ListCard>
      </Box>
    </SettingsLayout>
  )
}

export const getStaticProps = settingsStaticProps
