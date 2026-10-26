import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { getVapidPublicKey } from '@/services/notifications'

export default createHandler(HttpMethod.GET, getVapidPublicKey)
