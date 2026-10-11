import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { getSupportedParsers } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.GET, getSupportedParsers)
