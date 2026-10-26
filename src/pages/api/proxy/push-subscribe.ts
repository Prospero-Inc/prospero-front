import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { subscribePush } from '@/services/notifications'

export default createHandler(HttpMethod.POST, subscribePush)
