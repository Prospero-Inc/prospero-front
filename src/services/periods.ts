import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface PeriodCategoryBudget {
  budgeted: number
  spent: number
  remaining: number
}

export interface PeriodSummary {
  startDate: string | null
  endDate: string | null
  isOpen: boolean
  income: number
  totalSpent: number
  balance: number
  budget: {
    necesidad: PeriodCategoryBudget
    deseo: PeriodCategoryBudget
    ahorro: PeriodCategoryBudget
  }
  daysElapsed: number | null
  estimatedNextPaymentDate: string | null
  estimatedDaysRemaining: number | null
  recentTransactions: unknown[]
}

const getCurrentPeriod = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<PeriodSummary> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/periods/current',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { getCurrentPeriod }
