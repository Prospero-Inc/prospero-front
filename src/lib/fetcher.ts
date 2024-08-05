import { HttpMethod } from '@/enums'

import { IRequest, externalApiService } from './apiService'

type FetcherParams = IRequest

const fetcher = async <T>({
  endPoint: url,
  method = HttpMethod.GET,
  params,
  query
}: FetcherParams): Promise<T> => {
  try {
    const data =
      method === HttpMethod.POST ||
      method === HttpMethod.PUT ||
      method === HttpMethod.PATCH
        ? params
        : undefined

    return await externalApiService.request<T>({
      method,
      endPoint: url,
      data,
      query
    })
  } catch (error) {
    console.error(`Fetcher error: ${error}`)
    throw new Error(`Fetcher error: ${error}`)
  }
}

export default fetcher
