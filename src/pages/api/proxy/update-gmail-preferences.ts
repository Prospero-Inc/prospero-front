import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateGmailPreferences } from '@/services/gmail'

export default createHandler(HttpMethod.PATCH, updateGmailPreferences)
