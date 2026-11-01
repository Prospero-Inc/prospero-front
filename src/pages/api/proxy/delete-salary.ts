import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteSalary } from '@/services/salary'

export default createHandler(HttpMethod.DELETE, deleteSalary)
