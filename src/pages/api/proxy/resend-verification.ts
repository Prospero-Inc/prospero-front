import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { resendVerification } from '@/services'

export default createHandler<{ email: string }, unknown>(
  HttpMethod.POST,
  resendVerification
)
