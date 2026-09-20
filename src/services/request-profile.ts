import { HttpMethod } from '@/enums'
import { UpdateProfileData } from '@/interfaces'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

const requestProfile = async (
  _ignoreData: unknown,
  params: Params | unknown
): Promise<unknown> => {
  console.log('params', params)
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

const updateProfile = async (
  data: UpdateProfileData,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params

  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: '/auth/profile',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { requestProfile, updateProfile }
