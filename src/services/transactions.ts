import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface TransactionData {
  amount: number
  date: string
  category: string
  type: 'FixedExpense' | 'VariableExpense' | 'Savings'
  description?: string
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
