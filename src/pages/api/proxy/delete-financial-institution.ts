import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteFinancialInstitution } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.DELETE, deleteFinancialInstitution)
