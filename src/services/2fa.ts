import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

const activate2FA = async (_ignore: unknown, params: Params | unknown) => {
  const { lang, authorization } = params as Params

  return await externalApiService
    .request({
      method: HttpMethod.GET,
      endPoint: '/auth/enable-2fa',
      headers: {
        'x-lang': `${lang}`,
        Authorization: authorization
      }
    })
    .catch((error: unknown) => {
      throw error
    })
}

const disable2FA = async (_ignore: unknown, params: Params | unknown) => {
  const { lang, authorization } = params as Params

  return await externalApiService
    .request({
      method: HttpMethod.GET,
      endPoint: '/auth/disable-2fa',
      headers: {
        'x-lang': `${lang}`,
        Authorization: authorization
      }
    })
    .catch((error: unknown) => {
      throw error
    })
}

const validateToken = async (
  data: { token: string },
  params: Params | unknown
) => {
  const { lang, authorization } = params as Params
  const { token } = data
  return await externalApiService
    .request({
      method: HttpMethod.POST,
      endPoint: '/auth/validate-2fa',
      headers: {
        'x-lang': `${lang}`,
        Authorization: authorization
      },
      data: {
        token
      }
    })
    .catch((error: unknown) => {
      throw error
    })
}

export { activate2FA, disable2FA, validateToken }
