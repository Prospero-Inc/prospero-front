import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateFinancialInstitution } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.PATCH, updateFinancialInstitution)
