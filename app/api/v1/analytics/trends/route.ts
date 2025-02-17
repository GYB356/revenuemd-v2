import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError, APIError } from '@/lib/api-utils'
import { rateLimiter } from '@/lib/rate-limit'
import { Cache } from '@/lib/cache'

const cache = new Cache({ prefix: 'trends:' })

const querySchema = z.object({
  interval: z.enum(['day', 'week', 'month']).optional().default('day')
})

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.safeParse({
      interval: searchParams.get('interval')
    })

    if (!query.success) {
      throw new APIError('Invalid parameters', 400)
    }

    const { interval } = query.data

    // Generate cache key based on query parameters
    const cacheKey = `${user.id}:${interval}`

    // Try to get from cache first
    return await cache.wrap(
      cacheKey,
      async () => {
        // Get data for the last 30 days
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        // Fetch data
        const [claims, patients] = await Promise.all([
          prisma.claim.findMany({
            where: {
              createdAt: { gte: startDate }
            },
            select: {
              amount: true,
              createdAt: true
            }
          }),
          prisma.patient.findMany({
            where: {
              createdAt: { gte: startDate }
            },
            select: {
              createdAt: true
            }
          })
        ])

        // Calculate growth rates
        const [patientGrowth, revenueGrowth, claimsGrowth] = await calculateGrowthRates()

        // Calculate trends
        const trends = calculateTrends(claims, patients, interval)

        return NextResponse.json({
          patientGrowth,
          revenueGrowth,
          claimsGrowth,
          trends
        })
      },
      300 // Cache for 5 minutes
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

async function calculateGrowthRates(): Promise<[number, number, number]> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Get data for current and previous periods
  const [
    currentPatients,
    previousPatients,
    currentRevenue,
    previousRevenue,
    currentClaims,
    previousClaims
  ] = await Promise.all([
    prisma.patient.count({
      where: { createdAt: { gte: thirtyDaysAgo, lt: now } }
    }),
    prisma.patient.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    }),
    prisma.claim.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo, lt: now } },
      _sum: { amount: true }
    }),
    prisma.claim.aggregate({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { amount: true }
    }),
    prisma.claim.count({
      where: { createdAt: { gte: thirtyDaysAgo, lt: now } }
    }),
    prisma.claim.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    })
  ])

  // Calculate growth rates
  const patientGrowth = calculateGrowthRate(currentPatients, previousPatients)
  const revenueGrowth = calculateGrowthRate(
    currentRevenue._sum.amount || 0,
    previousRevenue._sum.amount || 0
  )
  const claimsGrowth = calculateGrowthRate(currentClaims, previousClaims)

  return [patientGrowth, revenueGrowth, claimsGrowth]
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function calculateTrends(
  claims: Array<{ amount: number; createdAt: Date }>,
  patients: Array<{ createdAt: Date }>,
  interval: string
) {
  const periods = generatePeriods(interval)
  const trends = periods.map(period => {
    const periodClaims = claims.filter(claim => 
      isInPeriod(claim.createdAt, period.start, period.end)
    )
    const periodPatients = patients.filter(patient => 
      isInPeriod(patient.createdAt, period.start, period.end)
    )

    return {
      period: formatPeriod(period.start, interval),
      patients: periodPatients.length,
      claims: periodClaims.length,
      revenue: periodClaims.reduce((sum, claim) => sum + claim.amount, 0)
    }
  })

  return trends
}

function generatePeriods(interval: string): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = []
  const now = new Date()
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  let current = new Date(start)
  while (current < now) {
    const periodEnd = new Date(current)
    switch (interval) {
      case 'day':
        periodEnd.setDate(periodEnd.getDate() + 1)
        break
      case 'week':
        periodEnd.setDate(periodEnd.getDate() + 7)
        break
      case 'month':
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        break
    }

    periods.push({
      start: new Date(current),
      end: new Date(Math.min(periodEnd.getTime(), now.getTime()))
    })
    current = periodEnd
  }

  return periods
}

function isInPeriod(date: Date, start: Date, end: Date): boolean {
  return date >= start && date < end
}

function formatPeriod(date: Date, interval: string): string {
  switch (interval) {
    case 'day':
      return date.toISOString().split('T')[0]
    case 'week':
      const week = Math.ceil((date.getDate() + date.getDay()) / 7)
      return `Week ${week}, ${date.getFullYear()}`
    case 'month':
      return date.toLocaleString('default', { month: 'long', year: 'numeric' })
    default:
      return date.toISOString().split('T')[0]
  }
} 