import { HttpMethod } from '@/enums'
import axios, { HttpStatusCode } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

interface HandlerFunction<T, R> {
  (_data: T, ..._params: unknown[]): Promise<R>
}

const createHandler =
  <T, R>(method: HttpMethod, handlerFn: HandlerFunction<T, R>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { 'x-lang': lang } = req.headers
    try {
      if (req.method !== method)
        return res
          .status(HttpStatusCode.MethodNotAllowed)
          .json({ error: 'Method Not Allowed' })

      const data = await handlerFn(req.body, lang)
      return res.status(HttpStatusCode.Ok).json(data)
    } catch (error) {
      if (axios.isAxiosError(error))
        return res
          .status(HttpStatusCode.InternalServerError)
          .json({ error: error.message })

      return res.status(HttpStatusCode.InternalServerError).json({ error })
    }
  }

export default createHandler
