import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteInstitutionSender } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.DELETE, deleteInstitutionSender)
