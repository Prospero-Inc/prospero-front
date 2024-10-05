import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

const requestProfile = async (
  _ignoreData: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService
    .request({
      method: HttpMethod.GET,
      endPoint: '/auth/profile',
      headers: {
        'x-lang': `${lang}`,
        Authorization: authorization
      }
    })
    .catch(error => {
      console.log(error)
    })
}

export { requestProfile }
