import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createFinancialInstitution } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.POST, createFinancialInstitution)
