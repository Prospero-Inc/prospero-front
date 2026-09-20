import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteTransaction } from '@/services/transactions'

export default createHandler(HttpMethod.DELETE, deleteTransaction)
