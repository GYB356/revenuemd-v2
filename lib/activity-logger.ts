import { prisma } from "@/lib/db"
import { getCachedData, setCachedData } from "@/lib/redis"

export type ActivityType = 
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_PATIENT"
  | "UPDATE_PATIENT"
  | "DELETE_PATIENT"
  | "CREATE_CLAIM"
  | "UPDATE_CLAIM"
  | "DELETE_CLAIM"
  | "EXPORT_DATA"
  | "GENERATE_INSIGHTS"
  | "VIEW_INSIGHTS"
  | "CREATE_MEDICAL_RECORD"
  | "UPDATE_MEDICAL_RECORD"
  | "DELETE_MEDICAL_RECORD"

interface ActivityLog {
  userId: string
  type: ActivityType
  details: string
  metadata?: Record<string, any>
}

export async function logActivity(activity: ActivityLog) {
  try {
    const { userId, type, details, metadata } = activity

    // Store in database
    await prisma.log.create({
      data: {
        userId,
        action: type,
        details,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Invalidate relevant cache keys
    if (type.includes('MEDICAL_RECORD') || type.includes('CLAIM')) {
      await invalidateAnalyticsCache()
    }

    return true
  } catch (error) {
    console.error('Failed to log activity:', error)
    return false
  }
}

async function invalidateAnalyticsCache() {
  const cacheKeys = [
    'analytics:average-claim-amount',
    'analytics:recent-activity:10',
    'analytics:recent-activity:20',
    'analytics:recent-activity:50',
  ]

  for (const key of cacheKeys) {
    try {
      await setCachedData(key, null, 0)
    } catch (error) {
      console.error(`Failed to invalidate cache key ${key}:`, error)
    }
  }
} 