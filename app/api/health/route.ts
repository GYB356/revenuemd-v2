import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/cache'
import { logger } from '@/lib/logger'

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database health check failed', { error })
    return false
  }
}

async function checkRedis() {
  try {
    await redis.ping()
    return true
  } catch (error) {
    logger.error('Redis health check failed', { error })
    return false
  }
}

export async function GET() {
  const startTime = Date.now()

  try {
    // Check critical services
    const [dbHealth, redisHealth] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ])

    // Get system metrics
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    const health = {
      status: dbHealth && redisHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      services: {
        database: dbHealth ? 'up' : 'down',
        redis: redisHealth ? 'up' : 'down'
      },
      responseTime: Date.now() - startTime
    }

    const status = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, { status })
  } catch (error) {
    logger.error('Health check failed', { error })
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
} 