import type { NextApiRequest, NextApiResponse } from "next"
import dbConnect from "../../../lib/mongodb"
import User from "../../../models/User"
import { authMiddleware } from "../../../middleware/authMiddleware"
import { metricsMiddleware } from "../../../middleware/metricsMiddleware"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  await dbConnect()

  const user = await User.findById((req as any).userId).select("-password")

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  res.status(200).json(user)
}

export default metricsMiddleware(authMiddleware(handler))

