import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/db"
import { limiter } from "@/lib/rate-limit"
import logger from "@/lib/logger"

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await limiter(req)

    const { username, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { username } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: "15m" })

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

    // Save refresh token in the database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })

    response.cookies.set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 900, // 15 minutes
    })

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 604800, // 7 days
    })

    logger.info(`User ${user.username} logged in successfully`)
    return response
  } catch (error) {
    logger.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

