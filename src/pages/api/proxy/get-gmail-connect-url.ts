import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { getGmailConnectUrl } from '@/services/gmail'

export default createHandler(HttpMethod.GET, getGmailConnectUrl)
