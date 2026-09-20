import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

interface LoginCredentials {
  email: string
  password: string
}

const login = async (data: LoginCredentials, params: Params | unknown) => {
  const { lang } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/auth/login',
    data,
    headers: { 'x-lang': `${lang}` }
  })
}

interface VerifyLoginTwoFactorData {
  preAuthToken: string
  token: string
}

const verifyLoginTwoFactor = async (
  data: VerifyLoginTwoFactorData,
  params: Params | unknown
) => {
  const { lang } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/auth/login/verify-2fa',
    data,
    headers: { 'x-lang': `${lang}` }
  })
}

export { login, verifyLoginTwoFactor }
