import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * limit

    const whereClause = status ? { status } : {}

    const claims = await prisma.claim.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    })

    const totalClaims = await prisma.claim.count({ where: whereClause })

    return NextResponse.json({
      claims,
      totalPages: Math.ceil(totalClaims / limit),
      currentPage: page,
      totalClaims,
    })
  } catch (error) {
    console.error("Failed to fetch claims:", error)
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
  }
}

