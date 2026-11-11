import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import type { BudgetCategory } from '@/services/transactions'
import { Params } from '@/types'

/** Una tarjeta de Apple Wallet: el backend la crea sola con el primer gasto
 * que manda el atajo de iPhone. */
export interface WalletCard {
  id: number
  userId: number
  name: string
  /** Categoría con la que entran sus gastos; `null` = "según el comercio"
   * (lo aprendido por comercio, si no, a la cola de revisión). */
  defaultCategory: BudgetCategory | null
  financialInstitutionId: number | null
  institutionName: string | null
  /** No category chosen for it yet since it showed up ("Nueva"). */
  isNew: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateWalletCardData {
  name?: string
  defaultCategory?: BudgetCategory | null
  financialInstitutionId?: number | null
}

const getWalletCards = async (
  _filters: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/wallet-cards',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateWalletCard = async (
  data: UpdateWalletCardData,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: `/wallet-cards/${id}`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { getWalletCards, updateWalletCard }
