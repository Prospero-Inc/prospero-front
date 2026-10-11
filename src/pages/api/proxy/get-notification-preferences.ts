import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { getNotificationPreferences } from '@/services/notifications'

export default createHandler(HttpMethod.GET, getNotificationPreferences)
