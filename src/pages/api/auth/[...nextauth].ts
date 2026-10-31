import { config } from '@/config'
import { runWithClientIp } from '@/lib/server/clientIp'
import type { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth/next'

// The login (authorize) and refresh calls made here carry the client's IP.
export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return runWithClientIp(req, () => NextAuth(req, res, { ...config }))
}
