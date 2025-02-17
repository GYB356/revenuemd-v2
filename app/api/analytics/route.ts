import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total counts
    const [patientCount, claimCount, pendingClaimCount] = await Promise.all([
      prisma.patient.count(),
      prisma.claim.count(),
      prisma.claim.count({
        where: { status: "PENDING" }
      })
    ])

    // Get claims by status
    const claimsByStatus = await prisma.claim.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get recent patient registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPatients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        createdAt: true
      }
    })

    // Group patients by day
    const patientsByDay = recentPatients.reduce((acc, patient) => {
      const date = patient.createdAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      overview: {
        totalPatients: patientCount,
        totalClaims: claimCount,
        pendingClaims: pendingClaimCount,
      },
      claimsByStatus,
      patientRegistrations: Object.entries(patientsByDay).map(([date, count]) => ({
        date,
        count,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
} 