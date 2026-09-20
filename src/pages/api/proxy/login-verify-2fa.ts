import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { verifyLoginTwoFactor } from '@/services'

export default createHandler(HttpMethod.POST, verifyLoginTwoFactor)
