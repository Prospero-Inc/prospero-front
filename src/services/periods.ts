import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

import { SalaryListItem } from './salary'
import {
  BudgetCategory,
  TransactionListItem,
  TransactionReviewStatus
} from './transactions'

export interface PeriodCategoryBudget {
  budgeted: number
  spent: number
  remaining: number
}

/** Shape de cada entrada de `PeriodSummary.recentTransactions`. A diferencia
 * de `TransactionListItem` (`GET /transactions`), estas filas vienen de
 * `TransactionsService.findAllForUser` (la variante sin el cómputo de
 * `possibleGmailDuplicate`), así que ese campo nunca está presente aquí. */
export interface PeriodRecentTransaction {
  id: number
  amount: number
  date: string
  category: BudgetCategory | null
  description: string | null
  reviewStatus: TransactionReviewStatus
}

export interface PeriodSummary {
  /** Fecha de inicio (YYYY-MM-DD) o 'initial' (período previo a la primera
   * nómina). Es lo que esperan los `?period=` de abajo. */
  key: string
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
  recentTransactions: PeriodRecentTransaction[]
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

const authHeaders = (params: Params | unknown) => {
  const { lang, authorization } = params as Params
  return { 'x-lang': `${lang}`, Authorization: authorization }
}

/** Todos los períodos, del más reciente al más antiguo. */
const getPeriods = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<PeriodSummary[]> =>
  await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/periods',
    headers: authHeaders(params)
  })

/** Gastos que cuentan para el período (`periodOverride` incluido). Sin
 * `period` → el período actual. */
const getPeriodTransactions = async (
  period: string | undefined,
  params: Params | unknown
): Promise<TransactionListItem[]> =>
  await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/periods/transactions',
    query: period ? { period } : {},
    headers: authHeaders(params)
  })

/** Ingresos del período. Sin `period` → el período actual. */
const getPeriodSalary = async (
  period: string | undefined,
  params: Params | unknown
): Promise<SalaryListItem[]> =>
  await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/periods/salary',
    query: period ? { period } : {},
    headers: authHeaders(params)
  })

/** `GET /periods/month`: totales del mes calendario actual (spec §6 "Del
 * mes"), independientes de los períodos de pago. */
export interface MonthSummary {
  year: number
  /** 1–12. */
  month: number
  income: number
  payrollCount: number
  totalSpent: number
  balance: number
}

const getMonthSummary = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<MonthSummary> =>
  await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/periods/month',
    headers: authHeaders(params)
  })

export {
  getCurrentPeriod,
  getMonthSummary,
  getPeriods,
  getPeriodTransactions,
  getPeriodSalary
}
