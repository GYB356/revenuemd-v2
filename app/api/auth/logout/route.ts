import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = cookies().get("refreshToken")?.value

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    // Clear cookies
    const response = NextResponse.json({ success: true })
    
    response.cookies.delete("token")
    response.cookies.delete("refreshToken")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}