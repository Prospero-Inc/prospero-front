import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { disable2FA } from '@/services'

export default createHandler(HttpMethod.GET, disable2FA)
