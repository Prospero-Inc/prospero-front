import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { unsubscribePush } from '@/services/notifications'

export default createHandler(HttpMethod.POST, unsubscribePush)
