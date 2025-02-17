import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { type NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export interface AuthUser {
  id: string
  role: string
}

export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value

  if (!token) {
    return null
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    return verified
  } catch (error) {
    return null
  }
}

export function generateAccessToken(user: AuthUser) {
  return jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  })
}

export function generateRefreshToken(user: AuthUser) {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  })
}

export function setTokenCookie(token: string) {
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 15, // 15 minutes
  })
}

export function setRefreshTokenCookie(token: string) {
  cookies().set("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function verifyRefreshToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthUser
    
    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })

    if (!storedToken || new Date() > storedToken.expiresAt) {
      return null
    }

    return {
      id: storedToken.user.id,
      role: storedToken.user.role,
    }
  } catch (error) {
    return null
  }
}