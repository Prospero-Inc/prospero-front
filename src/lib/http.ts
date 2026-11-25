// Shared by the server's axios client (apiService) and the browser's
// fetch client (localApiService); no HTTP library here, so the browser
// bundle doesn't pull axios.

export type TMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type TParams = {
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

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const formattedEndpoint = (
  endPoint: string,
  params: TParams = {}
): string => {
  let formattedEndpoint = endPoint
  for (const [key, value] of Object.entries(params))
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, String(value))

  return formattedEndpoint
}

/** The error for a non-2xx answer whose body is `body` (parsed JSON). */
export const toHttpError = (status: number, body: unknown): HttpError => {
  const { message, errors } =
    typeof body === 'object' && body !== null
      ? (body as { message?: unknown; errors?: unknown })
      : { message: undefined, errors: undefined }
  // Handle message if it's a string or an array of strings
  if (Array.isArray(errors)) return new HttpError(errors.join(', '), status)

  const formattedErrorMessage =
    typeof message === 'string'
      ? message
      : Array.isArray(message)
      ? message.join(', ')
      : 'An error occurred. Please try again.'

  console.error(`API error: ${formattedErrorMessage}`)
  return new HttpError(formattedErrorMessage, status)
}
