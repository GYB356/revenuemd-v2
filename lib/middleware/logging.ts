import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function loggingMiddleware(request: NextRequest) {
  const startTime = Date.now()
  const user = await verifyAuth(request)
  
  try {
    const response = NextResponse.next()

    // Log the request
    await prisma.log.create({
      data: {
        userId: user?.id,
        action: request.method,
        path: request.nextUrl.pathname,
        details: {
          query: Object.fromEntries(request.nextUrl.searchParams),
          duration: Date.now() - startTime,
          userAgent: request.headers.get("user-agent"),
        },
      },
    })

    return response
  } catch (error) {
    console.error("Logging error:", error)
    return NextResponse.next()
  }
} 