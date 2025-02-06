import type { NextApiRequest, NextApiResponse } from "next"
import { register, initMetrics } from "../../lib/metrics"

initMetrics()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", register.contentType)
  res.send(await register.metrics())
}

