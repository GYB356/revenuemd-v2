import { prisma } from "@/lib/db"
import { getCachedData, setCachedData } from "@/lib/redis"

export async function getTotalClaimsValue(): Promise<number> {
  const cacheKey = "analytics:total-claims-value"
  
  // Try to get from cache
  const cachedValue = await getCachedData<number>(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }

  // Calculate total claims value
  const result = await prisma.claim.aggregate({
    _sum: {
      amount: true,
    },
  })

  const totalValue = Number(result._sum.amount || 0)

  // Cache for 5 minutes
  await setCachedData(cacheKey, totalValue)

  return totalValue
}

export async function getAverageClaimAmount(): Promise<number> {
  const cacheKey = "analytics:average-claim-amount"
  
  // Try to get from cache
  const cachedValue = await getCachedData<number>(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }

  // Calculate average claim amount
  const result = await prisma.claim.aggregate({
    _avg: {
      amount: true,
    },
  })

  const averageAmount = Number(result._avg.amount || 0)

  // Cache for 5 minutes
  await setCachedData(cacheKey, averageAmount)

  return averageAmount
}

export async function getRecentActivity(limit: number = 10) {
  const cacheKey = `analytics:recent-activity:${limit}`
  
  // Try to get from cache
  const cachedValue = await getCachedData(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }

  // Get recent activity from claims instead of userActivity
  const activity = await prisma.claim.findMany({
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      patient: {
        select: {
          name: true,
        },
      },
    },
  })

  // Transform claims into activity format
  const formattedActivity = activity.map(claim => ({
    id: claim.id,
    type: 'CLAIM_UPDATE',
    timestamp: claim.updatedAt,
    details: `Claim ${claim.id} for patient ${claim.patient.name} was ${claim.status.toLowerCase()}`,
    user: null, // Since we don't have user activity, this will be null
  }))

  // Cache for 5 minutes
  await setCachedData(cacheKey, formattedActivity)

  return formattedActivity
} 