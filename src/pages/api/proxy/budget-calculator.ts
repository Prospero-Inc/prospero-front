import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { budgetCalculator } from '@/services'

export default createHandler(HttpMethod.GET, budgetCalculator)
