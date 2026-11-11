import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { deleteWalletCard } from '@/services/walletCards'

export default createHandler(HttpMethod.DELETE, deleteWalletCard)
