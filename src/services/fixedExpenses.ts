import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { BudgetCategory } from '@/services/transactions'
import { Params } from '@/types'

export interface FixedExpenseData {
  amount: number
  name: string
  budgetCategory: BudgetCategory
  dueDate: string
  reminder: boolean
  description?: string
}

const getFixedExpenses = async (
  _filters: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/fixed-expenses',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const createFixedExpense = async (
  data: FixedExpenseData,
  params: Params | unknown
) => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/fixed-expenses',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateFixedExpense = async (
  data: Partial<FixedExpenseData>,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: `/fixed-expenses/${id}`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const deleteFixedExpense = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.DELETE,
    endPoint: `/fixed-expenses/${id}`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const payFixedExpense = async (_ignore: unknown, params: Params | unknown) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: `/fixed-expenses/${id}/pay`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  payFixedExpense
}
