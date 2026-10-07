import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export type GmailConnectionStatusValue =
  | 'Connected'
  | 'Disconnected'
  | 'Expired'
  | 'Revoked'

export interface GmailConnectionStatus {
  connected: boolean
  status: GmailConnectionStatusValue
  lastSyncAt: string | null
  autoDetectEnabled: boolean
  notifyIncomeEnabled: boolean
}

export interface UpdateGmailPreferencesData {
  autoDetectEnabled?: boolean
  notifyIncomeEnabled?: boolean
}

const getGmailConnection = async (
  _filters: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/gmail/connection',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const getGmailConnectUrl = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/gmail/connect',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateGmailPreferences = async (
  data: UpdateGmailPreferencesData,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: '/gmail/connection',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const disconnectGmail = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.DELETE,
    endPoint: '/gmail/disconnect',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export {
  getGmailConnection,
  getGmailConnectUrl,
  updateGmailPreferences,
  disconnectGmail
}
