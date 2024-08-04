import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'

const budgetCalculator = async (amount: number): Promise<unknown> => {
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/salary/distribute/fifty-thirty-twenty',
    query: { amount }
  })
}

export { budgetCalculator }
