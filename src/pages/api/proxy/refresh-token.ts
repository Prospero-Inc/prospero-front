import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { refreshToken } from '@/services'

export default createHandler(HttpMethod.POST, refreshToken)
