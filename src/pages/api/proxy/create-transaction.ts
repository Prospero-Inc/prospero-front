import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createTransaction } from '@/services/transactions'

export default createHandler(HttpMethod.POST, createTransaction)
