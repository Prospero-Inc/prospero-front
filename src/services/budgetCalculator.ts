import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'

const budgetCalculator = async (amount: number): Promise<unknown> => {
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/salary/distribute/preview',
    query: { amount }
  })
}

export { budgetCalculator }
