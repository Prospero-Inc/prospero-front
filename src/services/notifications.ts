import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface NotificationPreferences {
  gmailReviewEmailEnabled: boolean
  budgetAlertEmailEnabled: boolean
}

export interface UpdateNotificationPreferencesData {
  gmailReviewEmailEnabled?: boolean
  budgetAlertEmailEnabled?: boolean
}

const getNotificationPreferences = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/notifications/preferences',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateNotificationPreferences = async (
  data: UpdateNotificationPreferencesData,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: '/notifications/preferences',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { getNotificationPreferences, updateNotificationPreferences }
