import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createSalary } from '@/services/salary'

export default createHandler(HttpMethod.POST, createSalary)
