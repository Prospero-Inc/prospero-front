import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { syncGmailNow } from '@/services/gmail'

export default createHandler(HttpMethod.POST, syncGmailNow)
