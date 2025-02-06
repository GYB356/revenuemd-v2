import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dbConnect from "../../../lib/mongodb"
import User from "../../../models/User"
import { metricsMiddleware } from "../../../middleware/metricsMiddleware"
import rateLimit from "../../../middleware/rateLimitMiddleware"

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    await limiter.check(res, 10, "CACHE_TOKEN")
  } catch {
    return res.status(429).json({ error: "Rate limit exceeded" })
  }

  await dbConnect()

  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" })
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return res.status(400).json({ error: "Invalid credentials" })
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  })

  res.status(200).json({ token })
}

export default metricsMiddleware(handler)

