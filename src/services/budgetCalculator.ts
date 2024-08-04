import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'

type Params = {
  [key: string]: unknown
}
const budgetCalculator = async (
  amount: number,
  { lang }: Params
): Promise<unknown> => {
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/salary/distribute/preview',
    headers: {
      'x-lang': `${lang}`
    },
    query: { amount }
  })
}

export { budgetCalculator }
