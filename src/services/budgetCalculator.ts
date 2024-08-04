import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'

type Params = {
  [key: string]: string
}
const budgetCalculator = async (
  _amount: number,
  params: (Params & { amount: number }) | unknown
): Promise<unknown> => {
  const { lang, authorization, amount } = params as Params
  return await externalApiService
    .request({
      method: HttpMethod.GET,
      endPoint: '/salary/distribute/preview',
      headers: {
        'x-lang': `${lang}`,
        Authorization: authorization
      },
      query: { amount }
    })
    .catch(error => {
      console.log(error)
    })
}

export { budgetCalculator }
