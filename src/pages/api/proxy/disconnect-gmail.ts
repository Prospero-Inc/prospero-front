import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { disconnectGmail } from '@/services/gmail'

export default createHandler(HttpMethod.DELETE, disconnectGmail)
