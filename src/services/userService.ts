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
export { registerUser, forgotPassword }
