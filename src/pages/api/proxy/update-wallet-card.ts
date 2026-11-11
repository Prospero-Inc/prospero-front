import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateWalletCard } from '@/services/walletCards'

export default createHandler(HttpMethod.PATCH, updateWalletCard)
