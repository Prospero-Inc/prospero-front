import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

interface CreateSalaryData {
  amount: number
}

const createSalary = async (
  data: CreateSalaryData,
  params: Params | unknown
) => {
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

export { createSalary, getSalaryDetails }
