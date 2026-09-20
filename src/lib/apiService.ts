import { AxiosInstance, AxiosResponse } from 'axios'
import axios from 'axios'

import axiosInstance from './axiosInstance'
import axiosLocal from './axiosInstanceLocal'

type TMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type TParams = {
  [key: string]: string | number
}

export interface IRequest {
  method: TMethod
  endPoint: string
  data?: unknown | null
  params?: TParams
  query?: TParams
  headers?: Record<string, string>
}

const formattedEndpoint = (endPoint: string, params: TParams = {}): string => {
  let formattedEndpoint = endPoint
  for (const [key, value] of Object.entries(params))
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, String(value))

  return formattedEndpoint
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

class ApiService {
  private static externalInstance: ApiService
  private static localInstance: ApiService
  private axiosInstance: AxiosInstance

  private constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance
  }

  private readonly methods = {
    GET: <T>(url: string, query?: TParams, headers?: Record<string, string>) =>
      this.axiosInstance.get<T>(url, { params: query, headers }),
    POST: <T>(url: string, data?: unknown, headers?: Record<string, string>) =>
      this.axiosInstance.post<T>(url, data, { headers }),
    PUT: <T>(url: string, data?: unknown, headers?: Record<string, string>) =>
      this.axiosInstance.put<T>(url, data, { headers }),
    PATCH: <T>(url: string, data?: unknown, headers?: Record<string, string>) =>
      this.axiosInstance.patch<T>(url, data, { headers }),
    DELETE: <T>(
      url: string,
      _data?: unknown,
      headers?: Record<string, string>
    ) => this.axiosInstance.delete<T>(url, { headers })
  }

  public static getExternalInstance(): ApiService {
    if (!ApiService.externalInstance)
      ApiService.externalInstance = new ApiService(axiosInstance)

    return ApiService.externalInstance
  }

  public static getLocalInstance(): ApiService {
    if (!ApiService.localInstance)
      ApiService.localInstance = new ApiService(axiosLocal)

    return ApiService.localInstance
  }

  public async request<T>({
    method,
    endPoint,
    data,
    params = {},
    query = {},
    headers = {}
  }: IRequest): Promise<T> {
    try {
      const url = formattedEndpoint(endPoint, params)
      let response: AxiosResponse
      if (method === 'GET')
        response = await this.methods[method]<T>(url, query, headers)
      else response = await this.methods[method]<T>(url, data, headers)

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500
        const errorMessage = error.response?.data?.message
        const errorArr = error.response?.data?.errors
        // Handle message if it's a string or an array of strings
        if (errorArr) throw new HttpError(errorArr.join(', '), status)

        const formattedErrorMessage =
          typeof errorMessage === 'string'
            ? errorMessage
            : Array.isArray(errorMessage)
            ? errorMessage.join(', ')
            : 'An error occurred. Please try again.'

        console.error(`API error: ${formattedErrorMessage}`)
        throw new HttpError(formattedErrorMessage, status)
      }

      // Handle non-Axios errors
      console.error('ERROR SERVER API SERVICE', error)
      throw new HttpError(
        'An unexpected error occurred. Please try again.',
        500
      )
    }
  }
}

const externalApiService = ApiService.getExternalInstance()
const localApiService = ApiService.getLocalInstance()

export { externalApiService, localApiService }
