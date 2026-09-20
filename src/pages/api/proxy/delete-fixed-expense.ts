import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteFixedExpense } from '@/services/fixedExpenses'

export default createHandler(HttpMethod.DELETE, deleteFixedExpense)
