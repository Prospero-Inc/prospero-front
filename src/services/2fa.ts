import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

const activate2FA = async (params: Params | unknown) => {
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
      console.log(error)
    })
}

export { activate2FA }
