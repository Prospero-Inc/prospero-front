import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateFixedExpense } from '@/services/fixedExpenses'

export default createHandler(HttpMethod.PATCH, updateFixedExpense)
