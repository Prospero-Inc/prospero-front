import { HttpMethod } from '@/enums'
import { forgotPassword } from '@/services'
import axios, { HttpStatusCode } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== HttpMethod.PATCH)
      return res
        .status(HttpStatusCode.MethodNotAllowed)
        .json({ error: 'Method Not Allowed' })

    const data = await forgotPassword(req.body)
    return res.status(HttpStatusCode.Ok).json(data)
  } catch (error) {
    if (axios.isAxiosError(error))
      return res
        .status(HttpStatusCode.InternalServerError)
        .json({ error: error.message })

    return res.status(HttpStatusCode.InternalServerError).json({ error })
  }
}
