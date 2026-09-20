export const PRE_AUTH_TOKEN_STORAGE_KEY = 'prospero:preAuthToken'

export interface LoginUser {
  id: number
  name: string
  email: string
  username: string
}

export interface LoginSuccessResponse {
  accessToken: string
  user: LoginUser
}

export interface RequiresTwoFactorResponse {
  requires2FA: true
  preAuthToken: string
  message: string
}

export type LoginResponse = LoginSuccessResponse | RequiresTwoFactorResponse

export const isRequiresTwoFactorResponse = (
  response: LoginResponse
): response is RequiresTwoFactorResponse =>
  (response as RequiresTwoFactorResponse).requires2FA === true
