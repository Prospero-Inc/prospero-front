import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

interface RefreshTokenData {
  refreshToken: string
}

const refreshToken = async (
  data: RefreshTokenData,
  params: Params | unknown
) => {
  const { lang } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/auth/refresh',
    data,
    headers: { 'x-lang': `${lang}` }
  })
}

const logout = async (data: RefreshTokenData, params: Params | unknown) => {
  const { lang } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/auth/logout',
    data,
    headers: { 'x-lang': `${lang}` }
  })
}

/** Revokes every refresh token of the signed-in user ("Cerrar sesión en
 * todos los dispositivos"). */
const logoutAll = async (_ignore: unknown, params: Params | unknown) => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/auth/logout-all',
    headers: { 'x-lang': `${lang}`, Authorization: authorization }
  })
}

export { logout, logoutAll, refreshToken }
