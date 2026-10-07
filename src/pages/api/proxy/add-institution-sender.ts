import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { addInstitutionSender } from '@/services/financialInstitutions'

export default createHandler(HttpMethod.POST, addInstitutionSender)
