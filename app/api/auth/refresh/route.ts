import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import jwt from "jsonwebtoken"
import { z } from "zod"
import type { NextRequest } from "next/server"
import { logActivity } from "@/lib/activity-logger"

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = refreshTokenSchema.parse(body)

    // Find the refresh token in the database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      )
    }

    // Check if the token has expired
    if (new Date() > storedToken.expiresAt) {
      // Delete the expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      })

      // Log the failed attempt
      await logActivity({
        userId: storedToken.user.id,
        type: "REFRESH_TOKEN_EXPIRED",
        details: "Attempted to use expired refresh token",
      })

      return NextResponse.json(
        { error: "Refresh token has expired" },
        { status: 401 }
      )
    }

    // Verify the token signature
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)
    } catch (error) {
      // Delete the invalid token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      })

      // Log the invalid token attempt
      await logActivity({
        userId: storedToken.user.id,
        type: "INVALID_REFRESH_TOKEN",
        details: "Invalid refresh token signature",
      })

      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    )

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: storedToken.user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    )

    // Update refresh token in database with new expiration
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Log successful token refresh
    await logActivity({
      userId: storedToken.user.id,
      type: "TOKEN_REFRESH",
      details: "Successfully refreshed access token",
    })

    // Return new tokens
    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    )
  }
}