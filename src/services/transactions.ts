import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export type BudgetCategory = 'Necesidad' | 'Deseo' | 'Ahorro'
export type PeriodOverride = 'Previous' | 'Current'
export type MovementSource = 'Manual' | 'Gmail' | 'Shortcut'
export type TransactionReviewStatus = 'Detected' | 'PendingReview' | 'Confirmed'

export interface PossibleGmailDuplicate {
  id: number
  senderEmail: string
  processedAt: string
}

export interface TransactionData {
  amount: number
  date: string
  category: BudgetCategory
  description?: string
  periodOverride?: PeriodOverride | ''
}

/** Shape de cada fila de `GET /transactions`: lo mismo que `TransactionData`
 * más los campos de solo lectura que nunca se mandan en un create/update
 * (`category` además puede venir `null` mientras la fila está
 * `Detected`/`PendingReview` sin clasificar todavía). */
export interface TransactionListItem extends Omit<TransactionData, 'category'> {
  id: number
  category: BudgetCategory | null
  source: MovementSource
  reviewStatus: TransactionReviewStatus
  /** Gasto fijo que paga esta fila, si la generó "marcar como pagado". */
  fixedExpenseName: string | null
  /** Banco del que se detectó (Gmail), si se conoce. */
  institutionName: string | null
  possibleGmailDuplicate: PossibleGmailDuplicate | null
  /** Categoría que el atajo de iPhone sugiere (tarjeta o comercio ya
   * aprendido) para una fila sin clasificar; ignorar si `category` ya está. */
  suggestedCategory?: BudgetCategory | null
  /** Wallet card it was paid with (iPhone Shortcut), if any. */
  walletCard?: { id: number; name: string } | null
}

interface TransactionFilters {
  from?: string
  to?: string
  /** Separados por coma, p. ej. 'Detected,PendingReview'. */
  reviewStatus?: string
}

const getTransactions = async (
  filters: TransactionFilters = {},
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/transactions',
    query: filters as Record<string, string>,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const createTransaction = async (
  data: TransactionData,
  params: Params | unknown
) => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/transactions',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

/** `PATCH /transactions/:id`. `rememberMerchant` (review queue, iPhone
 * Shortcut rows; the API defaults to true) says whether confirming a
 * category teaches it for that merchant. */
export type UpdateTransactionData = Partial<TransactionData> & {
  rememberMerchant?: boolean
}

const updateTransaction = async (
  data: UpdateTransactionData,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: `/transactions/${id}`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const deleteTransaction = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.DELETE,
    endPoint: `/transactions/${id}`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
}
