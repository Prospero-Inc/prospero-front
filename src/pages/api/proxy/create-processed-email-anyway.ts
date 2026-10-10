import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createProcessedEmailAnyway } from '@/services/processedEmails'

export default createHandler(HttpMethod.POST, createProcessedEmailAnyway)
