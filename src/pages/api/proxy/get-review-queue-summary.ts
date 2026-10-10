import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { getReviewQueueSummary } from '@/services/reviewQueue'

export default createHandler(HttpMethod.GET, getReviewQueueSummary)
