import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { BudgetCategory } from '@/services/transactions'
import { Params } from '@/types'

export type IncomeType = 'Payroll' | 'Extra'

export interface SalaryData {
  amount: number
  date: string
  type?: IncomeType
  /**
   * Solo aplica cuando type === 'Extra'. Si se especifica, el monto se
   * earmarca 100% a esta categoría en vez de repartirse por el split
   * porcentual normal. El backend rechaza este campo con 400 si
   * type === 'Payroll', así que nunca debe enviarse en ese caso.
   */
  budgetCategory?: BudgetCategory | ''
  /**
   * Solo aplica cuando type === 'Extra'. Si es true, ignora
   * budgetCategory y reparte el monto por el split normal (igual que un
   * Payroll). Default: false. El backend rechaza este campo con 400 si
   * type === 'Payroll', así que nunca debe enviarse en ese caso.
   */
  distributeAutomatically?: boolean
}

const createSalary = async (data: SalaryData, params: Params | unknown) => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/salary',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateSalary = async (
  data: Partial<SalaryData>,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: `/salary/${id}`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const getSalaryList = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/salary',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const getSalaryDetails = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/salary/details',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { createSalary, updateSalary, getSalaryList, getSalaryDetails }
