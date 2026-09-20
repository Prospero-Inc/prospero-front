import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { payFixedExpense } from '@/services/fixedExpenses'

export default createHandler(HttpMethod.POST, payFixedExpense)
