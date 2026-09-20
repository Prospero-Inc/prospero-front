import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateTransaction } from '@/services/transactions'

export default createHandler(HttpMethod.PATCH, updateTransaction)
