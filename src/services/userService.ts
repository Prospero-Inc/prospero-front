import { HttpMethod } from '@/enums'
import { RegisterViewProps } from '@/interfaces'
import { externalApiService } from '@/lib/apiService'
import { User } from 'next-auth'

const registerUser = async (user: RegisterViewProps): Promise<User> => {
  const response = await externalApiService.request<User>({
    method: HttpMethod.POST,
    endPoint: '/auth/signup',
    data: user
  })
  return response
}

const forgotPassword = async (
  {
    email
  }: {
    email: string
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._: unknown[]
): Promise<unknown> => {
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: 'auth/request-reset-password',
    data: { email }
  })
}
const activateAccount = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: unknown,
  ...params: unknown[]
): Promise<unknown> => {
  // createHandler passes the request's query string as the 2nd argument.
  const { id, code } = (params[0] ?? {}) as { id?: string; code?: string }
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: 'auth/activate-account',
    query: { id: String(id ?? ''), code: String(code ?? '') }
  })
}

const resendVerification = async (
  { email }: { email: string },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._: unknown[]
): Promise<unknown> => {
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: 'auth/resend-verification',
    data: { email }
  })
}

export { registerUser, forgotPassword, activateAccount, resendVerification }
