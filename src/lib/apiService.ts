import { AxiosResponse } from 'axios'
import axios from 'axios'

import axiosInstance from './axiosInstance'

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
}

const formattedEndpoint = (endPoint: string, params: TParams = {}): string => {
  let formattedEndpoint = endPoint
  for (const [key, value] of Object.entries(params))
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, String(value))

  return formattedEndpoint
}

/**
 * ApiService class is a singleton class that handles all the requests to the API.
 * It has a private methods object that contains the methods GET, POST, PUT, and DELETE.
 * The request method is a public method that receives an object with the method, endPoint, data, params, and query.
 * The method constructs the URL using the formattedEndpoint function and makes the request using the axiosInstance.
 * If the request is successful, it returns the data from the response; otherwise, it logs the error and throws it.
 * @param {T} T - The type of the data returned by the request.
 * @param {IRequest} IRequest - The interface for the request object.
 * @returns {Promise<T>} - A promise that resolves to the data returned by the request.
 * @throws {Error} - An error if the request fails.
 * @static {getInstance} - A static method that returns the instance of the ApiService class.
 * @example - const apiService = ApiService.getInstance()
 *           const data = await apiService.request<T>({ method: 'GET', endPoint: '/users', query: { page: 1 } })
 */

class ApiService {
  private static instance: ApiService

  private readonly methods = {
    GET: <T>(url: string, query?: TParams) =>
      axiosInstance.get<T>(url, { params: query }),
    POST: <T>(url: string, data?: unknown) => axiosInstance.post<T>(url, data),
    PUT: <T>(url: string, data?: unknown) => axiosInstance.put<T>(url, data),
    PATCH: <T>(url: string, data?: unknown) =>
      axiosInstance.patch<T>(url, data),
    DELETE: <T>(url: string) => axiosInstance.delete<T>(url)
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) ApiService.instance = new ApiService()

    return ApiService.instance
  }

  public async request<T>({
    method,
    endPoint,
    data,
    params = {},
    query = {}
  }: IRequest): Promise<T> {
    try {
      const url = formattedEndpoint(endPoint, params ?? {})
      let response: AxiosResponse
      if (method === 'GET') response = await this.methods[method]<T>(url, query)
      else response = await this.methods[method]<T>(url, data)

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`API error: ${error.response?.data?.message}`)
        throw new Error(
          error.response?.data?.message ?? 'Error al iniciar sesion'
        )
      }

      console.log('ERROR SERVER API SERVICE', error)

      console.error(`API error: ${error}`)
      throw error
    }
  }
}

const apiService = ApiService.getInstance()
export default apiService
