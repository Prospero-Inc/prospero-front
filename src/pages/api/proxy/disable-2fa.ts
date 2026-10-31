import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { disable2FA } from '@/services'

export default createHandler<{ token: string }, unknown>(
  HttpMethod.POST,
  disable2FA
)
