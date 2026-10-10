import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export type BudgetCategory = 'Necesidad' | 'Deseo' | 'Ahorro'
export type PeriodOverride = 'Previous' | 'Current'
export type MovementSource = 'Manual' | 'Gmail'
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
  possibleGmailDuplicate: PossibleGmailDuplicate | null
}

interface TransactionFilters {
  from?: string
  to?: string
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

const updateTransaction = async (
  data: Partial<TransactionData>,
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
