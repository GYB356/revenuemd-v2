import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { type Claim, type ClaimStatus } from '@prisma/client'

export type DateRange = {
  startDate: Date
  endDate: Date
}

export type ClaimMetrics = {
  totalClaims: number
  totalAmount: number
  averageAmount: number
  approvalRate: number
  rejectionRate: number
  fraudulentRate: number
  averageProcessingTime: number
  claimsByStatus: Record<ClaimStatus, number>
  amountByStatus: Record<ClaimStatus, number>
}

export type TrendData = {
  date: Date
  value: number
}

export class AnalyticsService {
  private readonly CACHE_TTL = 1800 // 30 minutes

  async getClaimMetrics(dateRange: DateRange): Promise<ClaimMetrics> {
    const cacheKey = `metrics:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const claims = await prisma.claim.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        },
        deleted: false
      },
      include: {
        history: true
      }
    })

    const metrics = await this.calculateMetrics(claims)
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics))

    return metrics
  }

  async getTrends(metric: keyof ClaimMetrics, dateRange: DateRange, interval: 'day' | 'week' | 'month'): Promise<TrendData[]> {
    const cacheKey = `trends:${metric}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}:${interval}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const trends = await this.calculateTrends(metric, dateRange, interval)
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(trends))

    return trends
  }

  async getTopProviders(dateRange: DateRange, limit: number = 10) {
    return prisma.claim.groupBy({
      by: ['providerId'],
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        },
        deleted: false
      },
      _count: {
        _all: true
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: limit
    })
  }

  async getFraudStats(dateRange: DateRange) {
    const claims = await prisma.claim.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        },
        isFraudulent: true,
        deleted: false
      },
      include: {
        provider: true
      }
    })

    return {
      totalFraudulentClaims: claims.length,
      totalFraudulentAmount: claims.reduce((sum, claim) => sum + claim.amount, 0),
      fraudByProvider: this.groupFraudByProvider(claims)
    }
  }

  private async calculateMetrics(claims: Claim[]): Promise<ClaimMetrics> {
    const totalClaims = claims.length
    const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0)
    
    const approvedClaims = claims.filter(claim => claim.status === 'APPROVED' || claim.status === 'PAID')
    const rejectedClaims = claims.filter(claim => claim.status === 'REJECTED')
    const fraudulentClaims = claims.filter(claim => claim.isFraudulent)

    const processingTimes = claims.map(claim => {
      const created = new Date(claim.createdAt)
      const resolved = claim.history
        .filter(h => ['APPROVED', 'REJECTED', 'PAID'].includes(h.status))
        .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())[0]
      
      return resolved ? resolved.changedAt.getTime() - created.getTime() : 0
    }).filter(time => time > 0)

    const claimsByStatus = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1
      return acc
    }, {} as Record<ClaimStatus, number>)

    const amountByStatus = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + claim.amount
      return acc
    }, {} as Record<ClaimStatus, number>)

    return {
      totalClaims,
      totalAmount,
      averageAmount: totalAmount / totalClaims,
      approvalRate: (approvedClaims.length / totalClaims) * 100,
      rejectionRate: (rejectedClaims.length / totalClaims) * 100,
      fraudulentRate: (fraudulentClaims.length / totalClaims) * 100,
      averageProcessingTime: processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length,
      claimsByStatus,
      amountByStatus
    }
  }

  private async calculateTrends(
    metric: keyof ClaimMetrics,
    dateRange: DateRange,
    interval: 'day' | 'week' | 'month'
  ): Promise<TrendData[]> {
    const claims = await prisma.claim.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        },
        deleted: false
      },
      include: {
        history: true
      }
    })

    return this.groupClaimsByInterval(claims, interval).map(group => ({
      date: group.date,
      value: this.calculateMetricValue(metric, group.claims)
    }))
  }

  private groupClaimsByInterval(claims: Claim[], interval: 'day' | 'week' | 'month') {
    // Implementation of grouping logic based on interval
    return []
  }

  private calculateMetricValue(metric: keyof ClaimMetrics, claims: Claim[]): number {
    // Implementation of metric calculation logic
    return 0
  }

  private groupFraudByProvider(claims: Claim[]) {
    return claims.reduce((acc, claim) => {
      const providerId = claim.providerId
      if (!acc[providerId]) {
        acc[providerId] = {
          count: 0,
          amount: 0
        }
      }
      acc[providerId].count++
      acc[providerId].amount += claim.amount
      return acc
    }, {} as Record<string, { count: number; amount: number }>)
  }
} 