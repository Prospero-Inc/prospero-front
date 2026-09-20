import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export type IncomeType = 'Payroll' | 'Extra'

export interface SalaryData {
  amount: number
  date: string
  type?: IncomeType
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
