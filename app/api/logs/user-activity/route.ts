import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')

    const where = {
      ...(startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {})
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.log.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Failed to fetch user activity logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch user activity logs" },
      { status: 500 }
    )
  }
}