import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

// Create rate limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'), // 20 requests per 10 seconds
  analytics: true,
  prefix: '@upstash/ratelimit'
})

export async function rateLimiter(request: NextRequest) {
  try {
    // Get IP address from request
    const ip = request.ip || '127.0.0.1'
    
    // Rate limit by IP
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    // Set rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', limit.toString())
    headers.set('X-RateLimit-Remaining', remaining.toString())
    headers.set('X-RateLimit-Reset', reset.toString())

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers }
      )
    }

    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    return null // Continue without rate limiting on error
  }
} 