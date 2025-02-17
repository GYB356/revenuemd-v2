import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { calculateAgeGroup, calculateGrowthRate } from '@/lib/insights/utils'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get last 12 months of data
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setMonth(startDate.getMonth() - 12)

    // Fetch patients data
    const patients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        gender: true,
        dateOfBirth: true,
      },
    })

    // Fetch claims data
    const claims = await prisma.claim.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'APPROVED',
      },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        procedureCodes: true,
      },
    })

    // Calculate monthly trends
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(endDate)
      date.setMonth(date.getMonth() - i)
      return date.toISOString().slice(0, 7) // YYYY-MM format
    }).reverse()

    const patientTrends = months.map(month => {
      const monthPatients = patients.filter(p => 
        p.createdAt.toISOString().startsWith(month)
      )
      return {
        month,
        newPatients: monthPatients.length,
        totalPatients: patients.filter(p => 
          p.createdAt.toISOString().slice(0, 7) <= month
        ).length,
      }
    })

    const claimsTrends = months.map(month => {
      const monthClaims = claims.filter(c => 
        c.createdAt.toISOString().startsWith(month)
      )
      return {
        month,
        claims: monthClaims.length,
        revenue: monthClaims.reduce((sum, c) => sum + (c.amount || 0), 0),
      }
    })

    // Calculate growth rates
    const patientGrowth = calculateGrowthRate(
      patientTrends[patientTrends.length - 2].newPatients,
      patientTrends[patientTrends.length - 1].newPatients
    )

    const revenueGrowth = calculateGrowthRate(
      claimsTrends[claimsTrends.length - 2].revenue,
      claimsTrends[claimsTrends.length - 1].revenue
    )

    // Calculate demographics
    const demographics = {
      byGender: patients.reduce((acc, p) => {
        acc[p.gender] = (acc[p.gender] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byAgeGroup: patients.reduce((acc, p) => {
        const ageGroup = calculateAgeGroup(p.dateOfBirth)
        acc[ageGroup] = (acc[ageGroup] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    // Calculate top procedures
    const procedureCounts = claims.reduce((acc, claim) => {
      claim.procedureCodes.forEach(code => {
        if (!acc[code]) {
          acc[code] = { count: 0, revenue: 0 }
        }
        acc[code].count++
        acc[code].revenue += claim.amount || 0
      })
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topProcedures = Object.entries(procedureCounts)
      .map(([name, { count, revenue }]) => ({ name, count, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Log activity
    await logActivity({
      userId: user.id,
      type: 'VIEW_INSIGHTS',
      details: 'Viewed trends insights',
    })

    return NextResponse.json({
      patientTrends,
      claimsTrends,
      patientGrowth,
      revenueGrowth,
      demographics,
      topProcedures,
    })
  } catch (error) {
    console.error('Failed to get trends insights:', error)
    return NextResponse.json(
      { error: 'Failed to get trends insights' },
      { status: 500 }
    )
  }
}

