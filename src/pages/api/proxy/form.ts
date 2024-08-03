import { registerUser } from '@/services'
import axios, { HttpStatusCode } from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = await registerUser(req.body)
    return res.status(HttpStatusCode.Ok).json(data)
  } catch (error) {
    if (axios.isAxiosError(error))
      return res
        .status(HttpStatusCode.InternalServerError)
        .json({ error: error.message })

    return res.status(HttpStatusCode.InternalServerError).json({ error })
  }
}
