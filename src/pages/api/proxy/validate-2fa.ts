import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { validateToken } from '@/services'

export default createHandler<{ token: string }, unknown>(
  HttpMethod.POST,
  validateToken
)
