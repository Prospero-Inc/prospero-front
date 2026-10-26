import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface NotificationPreferences {
  gmailReviewEmailEnabled: boolean
  gmailReviewPushEnabled: boolean
  budgetAlertEmailEnabled: boolean
}

export interface UpdateNotificationPreferencesData {
  gmailReviewEmailEnabled?: boolean
  gmailReviewPushEnabled?: boolean
  budgetAlertEmailEnabled?: boolean
}

export interface VapidPublicKeyResponse {
  /** `null` = el servidor no tiene VAPID configurado (push deshabilitado). */
  publicKey: string | null
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

export interface PushUnsubscribeData {
  endpoint: string
}

export interface PushOkResponse {
  ok: true
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

const getVapidPublicKey = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<VapidPublicKeyResponse> => {
  const { lang } = params as Params
  return await externalApiService.request<VapidPublicKeyResponse>({
    method: HttpMethod.GET,
    endPoint: '/notifications/push/vapid-public-key',
    headers: { 'x-lang': `${lang}` }
  })
}

const subscribePush = async (
  data: PushSubscriptionData,
  params: Params | unknown
): Promise<PushOkResponse> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request<PushOkResponse>({
    method: HttpMethod.POST,
    endPoint: '/notifications/push/subscriptions',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const unsubscribePush = async (
  data: PushUnsubscribeData,
  params: Params | unknown
): Promise<PushOkResponse> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request<PushOkResponse>({
    method: HttpMethod.POST,
    endPoint: '/notifications/push/unsubscribe',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export {
  getNotificationPreferences,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  updateNotificationPreferences
}
