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

export { registerUser }
