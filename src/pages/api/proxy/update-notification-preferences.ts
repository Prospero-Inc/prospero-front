import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateNotificationPreferences } from '@/services/notifications'

export default createHandler(HttpMethod.PATCH, updateNotificationPreferences)
