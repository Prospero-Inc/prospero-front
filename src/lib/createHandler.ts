import { HttpMethod } from '@/enums'
import { HttpError } from '@/lib/apiService'
import { HttpStatusCode } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

interface HandlerFunction<T, R> {
  (_data: T, ..._params: unknown[]): Promise<R>
}

const createHandler =
  <T, R>(method: HttpMethod, handlerFn: HandlerFunction<T, R>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { 'x-lang': lang, authorization } = req.headers as {
      'x-lang'?: string
      authorization?: string
    }
    const query = req.query as unknown as T // Obtener parámetros de consulta
    const body = req.body // Obtener el cuerpo de la solicitud

    try {
      if (req.method !== method)
        return res
          .status(HttpStatusCode.MethodNotAllowed)
          .json({ error: 'Method Not Allowed' })

      const data = await handlerFn(body, {
        lang: lang || '',
        authorization: authorization || '',
        ...query
      })
      return res.status(HttpStatusCode.Ok).json(data)
    } catch (error) {
      if (error instanceof HttpError)
        return res.status(error.status).json({ message: error.message })

      const message =
        error instanceof Error
          ? error.message
          : 'An error occurred. Please try again.'
      return res.status(HttpStatusCode.InternalServerError).json({ message })
    }
  }

export default createHandler
