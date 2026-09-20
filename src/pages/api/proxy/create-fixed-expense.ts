import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createFixedExpense } from '@/services/fixedExpenses'

export default createHandler(HttpMethod.POST, createFixedExpense)
