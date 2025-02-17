import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError, APIError } from '@/lib/api-utils'
import { rateLimiter } from '@/lib/rate-limit'
import { Cache } from '@/lib/cache'

const cache = new Cache({ prefix: 'claims:' })

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metric: z.enum(['totalClaims', 'approvalRate', 'totalAmount']).optional(),
  interval: z.enum(['day', 'week', 'month']).optional()
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
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      metric: searchParams.get('metric'),
      interval: searchParams.get('interval')
    })

    if (!query.success) {
      throw new APIError('Invalid parameters', 400)
    }

    const { startDate, endDate, metric, interval } = query.data

    // Generate cache key based on query parameters
    const cacheKey = `${user.id}:${startDate || ''}:${endDate || ''}:${metric || ''}:${interval || ''}`

    // Try to get from cache first
    return await cache.wrap(
      cacheKey,
      async () => {
        // Validate date range if provided
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            throw new APIError('Invalid date range', 400)
          }
        }

        // Build date filter
        const dateFilter = startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {}

        // Fetch claims data
        const claims = await prisma.claim.findMany({
          where: dateFilter,
          select: {
            amount: true,
            status: true,
            createdAt: true
          }
        })

        // Calculate metrics
        const totalClaims = claims.length
        const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0)
        const approvedClaims = claims.filter(claim => claim.status === 'APPROVED').length
        const approvalRate = totalClaims > 0 ? approvedClaims / totalClaims : 0

        // Calculate trends if interval is specified
        let trends = []
        if (interval && metric) {
          trends = calculateTrends(claims, interval, metric)
        }

        return NextResponse.json({
          metrics: {
            totalClaims,
            totalAmount,
            approvalRate
          },
          trends
        })
      },
      300 // Cache for 5 minutes
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

function calculateTrends(
  claims: Array<{ amount: number; status: string; createdAt: Date }>,
  interval: string,
  metric: string
) {
  const groupedClaims = claims.reduce((acc, claim) => {
    const period = getPeriodKey(claim.createdAt, interval)
    if (!acc[period]) {
      acc[period] = { totalClaims: 0, totalAmount: 0, approvedClaims: 0 }
    }
    acc[period].totalClaims++
    acc[period].totalAmount += claim.amount
    if (claim.status === 'APPROVED') {
      acc[period].approvedClaims++
    }
    return acc
  }, {} as Record<string, { totalClaims: number; totalAmount: number; approvedClaims: number }>)

  return Object.entries(groupedClaims)
    .map(([period, data]) => ({
      period,
      value: metric === 'totalClaims' ? data.totalClaims :
             metric === 'totalAmount' ? data.totalAmount :
             data.totalClaims > 0 ? data.approvedClaims / data.totalClaims : 0
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

function getPeriodKey(date: Date, interval: string): string {
  switch (interval) {
    case 'day':
      return date.toISOString().split('T')[0]
    case 'week':
      const week = Math.ceil((date.getDate() + date.getDay()) / 7)
      return `Week ${week}, ${date.getFullYear()}`
    case 'month':
      return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
    default:
      return date.toISOString().split('T')[0]
  }
} 