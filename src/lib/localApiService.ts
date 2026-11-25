import { getSession } from 'next-auth/react'

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
 * A 401 on a request with a Bearer token is retried once with a renewed one.
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

  const send = async (sentHeaders: Record<string, string>) => {
    try {
      return await fetch(url, {
        method,
        headers: {
          Accept: 'application/json, text/plain, */*',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...sentHeaders
        },
        body
      })
    } catch (error) {
      console.error('API network error', error) // no answer: as axios did
      throw new HttpError('An error occurred. Please try again.', 500)
    }
  }

  let response = await send(headers)

  // The token this tab holds may have expired before the next session poll
  // (e.g. the phone slept): ask NextAuth for the current one — its `jwt`
  // callback renews it — and retry once, only if it actually changed.
  const authKey = Object.keys(headers).find(
    key => key.toLowerCase() === 'authorization'
  )
  if (response.status === 401 && authKey) {
    const fresh = (await getSession())?.accessToken
    if (fresh && `Bearer ${fresh}` !== headers[authKey])
      response = await send({ ...headers, [authKey]: `Bearer ${fresh}` })
  }

  const payload = parseBody(await response.text())
  if (!response.ok) throw toHttpError(response.status, payload)
  // The caller states the response type, as with axios' generics.
  return payload as T
}

export const localApiService = { request }
