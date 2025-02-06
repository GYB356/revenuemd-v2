import type { NextApiRequest, NextApiResponse } from "next"
import { requestCounter, responseTimeHistogram } from "../lib/metrics"

export function metricsMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now()

    await handler(req, res)

    const duration = Date.now() - start
    requestCounter.inc({ method: req.method, path: req.url, status: res.statusCode })
    responseTimeHistogram.observe({ method: req.method, path: req.url, status: res.statusCode }, duration / 1000)
  }
}

