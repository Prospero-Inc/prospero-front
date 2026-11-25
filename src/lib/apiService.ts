import { AxiosInstance, AxiosResponse } from 'axios'
import axios from 'axios'

import axiosInstance from './axiosInstance'
import {
  type IRequest,
  type TParams,
  HttpError,
  formattedEndpoint,
  toHttpError
} from './http'

export { HttpError } from './http'
export type { IRequest } from './http'

class ApiService {
  private static externalInstance: ApiService
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
      if (axios.isAxiosError(error))
        throw toHttpError(error.response?.status ?? 500, error.response?.data)

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

export { externalApiService }
export { localApiService } from './localApiService'
