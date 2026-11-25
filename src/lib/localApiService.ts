import {
  type IRequest,
  HttpError,
  formattedEndpoint,
  toHttpError
} from './http'

const parseBody = (text: string): unknown => {
  try {
    return text ? JSON.parse(text) : text
  } catch {
    return text // not JSON: keep the raw text, as axios did
  }
}

/**
 * The browser's client for this app's own `/api/proxy/*` routes, on
 * `fetch` (axios stays server-only). Same contract as before: resolves to
 * the parsed body, throws `HttpError` with the real status and message.
 */
const request = async <T>({
  method,
  endPoint,
  data,
  params = {},
  query = {},
  headers = {}
}: IRequest): Promise<T> => {
  const path = `/api${formattedEndpoint(endPoint, params)}`
  const search = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)])
  ).toString()
  const url = search
    ? `${path}${path.includes('?') ? '&' : '?'}${search}`
    : path
  const body =
    method === 'GET' || method === 'DELETE' || data == null
      ? undefined
      : JSON.stringify(data)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      },
      body
    })
  } catch (error) {
    console.error('API network error', error) // no answer: as axios did
    throw new HttpError('An error occurred. Please try again.', 500)
  }

  const payload = parseBody(await response.text())
  if (!response.ok) throw toHttpError(response.status, payload)
  // The caller states the response type, as with axios' generics.
  return payload as T
}

export const localApiService = { request }
