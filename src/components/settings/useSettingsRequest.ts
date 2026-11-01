import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

/**
 * Calls one of the app's proxies with this session's Bearer token (the
 * proxies have no session of their own) and the current language.
 */
export const useSettingsRequest = () => {
  const { data: session } = useSession()
  const { locale } = useRouter()
  const token = session?.accessToken
  return useCallback(
    <T = unknown>(
      endPoint: string,
      method: Exclude<HttpMethod, HttpMethod.OPTIONS>,
      data?: Record<string, unknown>
    ) =>
      localApiService.request<T>({
        endPoint,
        method,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-lang': locale ?? 'es'
        }
      }),
    [token, locale]
  )
}

/** The generic "couldn't save" toast, with the backend's message if any. */
export const useErrorToast = () => {
  const { t } = useTranslation('settings')
  const toast = useToast()
  return useCallback(
    (error: unknown) =>
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : undefined,
        status: 'error',
        isClosable: true
      }),
    [t, toast]
  )
}
