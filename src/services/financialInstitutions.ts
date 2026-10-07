import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface InstitutionSender {
  id: number
  institutionId: number
  emailAddress: string
  createdAt: string
}

export interface FinancialInstitution {
  id: number
  userId: number
  name: string
  isActive: boolean
  senders: InstitutionSender[]
  createdAt: string
  updatedAt: string
}

export interface FinancialInstitutionData {
  name: string
  isActive?: boolean
}

const getFinancialInstitutions = async (
  _filters: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/financial-institutions',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const createFinancialInstitution = async (
  data: FinancialInstitutionData,
  params: Params | unknown
) => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/financial-institutions',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const updateFinancialInstitution = async (
  data: Partial<FinancialInstitutionData>,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.PATCH,
    endPoint: `/financial-institutions/${id}`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const deleteFinancialInstitution = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.DELETE,
    endPoint: `/financial-institutions/${id}`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const addInstitutionSender = async (
  data: { emailAddress: string },
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: `/financial-institutions/${id}/senders`,
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const deleteInstitutionSender = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id, senderId } = params as Params & {
    id: string
    senderId: string
  }
  return await externalApiService.request({
    method: HttpMethod.DELETE,
    endPoint: `/financial-institutions/${id}/senders/${senderId}`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export {
  getFinancialInstitutions,
  createFinancialInstitution,
  updateFinancialInstitution,
  deleteFinancialInstitution,
  addInstitutionSender,
  deleteInstitutionSender
}
