import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"

export function authMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.split(" ")[1]
      if (!token) {
        throw new Error("No token provided")
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      ;(req as any).userId = decoded.userId

      await handler(req, res)
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" })
    }
  }
}

