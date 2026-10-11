import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { dismissProcessedEmail } from '@/services/processedEmails'

export default createHandler(HttpMethod.POST, dismissProcessedEmail)
