import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateSalary } from '@/services/salary'

export default createHandler(HttpMethod.PATCH, updateSalary)
