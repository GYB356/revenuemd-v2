import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { NextRequest } from 'next/server'
import { AppError } from '../error-handler'

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Rate limit configurations for different routes
const rateLimits = {
  default: {
    requests: 100,
    duration: '1 m', // 100 requests per minute
  },
  auth: {
    requests: 5,
    duration: '1 m', // 5 login attempts per minute
  },
  export: {
    requests: 10,
    duration: '1 h', // 10 exports per hour
  },
  api: {
    requests: 1000,
    duration: '1 h', // 1000 API requests per hour
  },
}

// Create rate limiters
const limiters = Object.entries(rateLimits).reduce((acc, [key, config]) => {
  acc[key] = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.requests,
      config.duration
    ),
    analytics: true, // Enable analytics
  })
  return acc
}, {} as Record<string, Ratelimit>)

// Get the appropriate limiter based on the request path
function getLimiter(path: string): Ratelimit {
  if (path.startsWith('/api/auth')) return limiters.auth
  if (path.startsWith('/api/export')) return limiters.export
  if (path.startsWith('/api/')) return limiters.api
  return limiters.default
}

export async function checkRateLimit(request: NextRequest, userId?: string) {
  try {
    const path = request.nextUrl.pathname
    const limiter = getLimiter(path)
    
    // Create a unique identifier combining IP and userId if available
    const identifier = userId 
      ? `${request.ip}:${userId}:${path}`
      : `${request.ip}:${path}`

    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', limit.toString())
    headers.set('X-RateLimit-Remaining', remaining.toString())
    headers.set('X-RateLimit-Reset', reset.toString())

    if (!success) {
      throw new AppError(
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED',
        { reset, limit, remaining }
      )
    }

    return headers
  } catch (error) {
    if (error instanceof AppError) throw error
    
    // If rate limiting fails, log the error but allow the request
    console.error('Rate limit check failed:', error)
    return new Headers()
  }
} 