import type { NextApiRequest, NextApiResponse } from "next"
import bcrypt from "bcryptjs"
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
    await limiter.check(res, 3, "CACHE_TOKEN")
  } catch {
    return res.status(429).json({ error: "Rate limit exceeded" })
  }

  await dbConnect()

  const { email, password } = req.body

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = new User({
    email,
    password: hashedPassword,
  })

  await user.save()

  res.status(201).json({ message: "User created successfully" })
}

export default metricsMiddleware(handler)

