import type { NextApiRequest, NextApiResponse } from 'next'

// Liveness for docker compose's healthcheck and the deploy job: the Next
// server is up and answering. Deliberately doesn't call the backend, which
// has its own health check, so one being down doesn't roll back the other.
export default function health(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ status: 'ok' })
}
