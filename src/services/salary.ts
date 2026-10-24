import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import {
  BudgetCategory,
  MovementSource,
  PossibleGmailDuplicate
} from '@/services/transactions'
import { Params } from '@/types'

export type IncomeType = 'Payroll' | 'Extra'
export type IncomeReviewStatus = 'Detected' | 'PendingReview' | 'Classified'
export type IncomeCategory =
  | 'Payroll'
  | 'Extra'
  | 'Transfer'
  | 'Reimbursement'
  | 'Deposit'
  | 'Other'

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
  /**
   * Categoría de ingreso (distinta de `type`/`budgetCategory`). Un ingreso
   * detectado por Gmail nace sin ella ("Por clasificar"); asignarla vía
   * `PATCH /salary/:id` es lo que el usuario hace al revisar un pendiente,
   * y transiciona automáticamente `status` a `Classified` en el backend.
   */
  incomeCategory?: IncomeCategory | ''
  /** Concepto libre para identificar el ingreso en el listado. */
  description?: string
}

/** Shape de cada fila de `GET /salary`: lo mismo que `SalaryData` más los
 * campos de solo lectura que nunca se mandan en un create/update. */
export interface SalaryListItem extends Omit<SalaryData, 'incomeCategory'> {
  id: number
  status: IncomeReviewStatus
  incomeCategory: IncomeCategory | null
  source: MovementSource
  /** Banco del que se detectó (Gmail), si se conoce. */
  institutionName: string | null
  possibleGmailDuplicate: PossibleGmailDuplicate | null
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
  filters: { status?: string } | null,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/salary',
    query: filters ?? {},
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
