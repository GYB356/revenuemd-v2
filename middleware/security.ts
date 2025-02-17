import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export function securityHeaders() {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  }
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') || 
         '127.0.0.1'
}

export async function securityMiddleware(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https')) {
      return NextResponse.redirect(
        request.url.replace('http://', 'https://'),
        301
      )
    }

    // Block common attack patterns
    const url = request.url.toLowerCase()
    const blockedPatterns = [
      '/wp-admin',
      '/wordpress',
      '/wp-login',
      '.php',
      '.asp',
      '.aspx',
      '.jsp',
      '.cgi',
      '.env',
      '.git',
      'admin:admin',
      'admin:password',
      '../',
      '..\\',
      '<script',
      'javascript:',
      'data:text/html',
      'data:application/json'
    ]

    if (blockedPatterns.some(pattern => url.includes(pattern))) {
      logger.warn('Blocked suspicious request', {
        url: request.url,
        ip: clientIp,
        userAgent: request.headers.get('user-agent')
      })
      return new NextResponse(null, { status: 404 })
    }

    // Add security headers
    const response = NextResponse.next()
    Object.entries(securityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    logger.error('Security middleware error', { error })
    return NextResponse.next()
  }
}

// Rate limiting by IP with improved cleanup
const ipRateLimits = new Map<string, { count: number; timestamp: number }>()
const WINDOW_SIZE = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // per minute
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Periodic cleanup of old rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of ipRateLimits.entries()) {
    if (now - data.timestamp > WINDOW_SIZE) {
      ipRateLimits.delete(ip)
    }
  }
}, CLEANUP_INTERVAL)

export function ipRateLimit(request: NextRequest) {
  const clientIp = getClientIp(request)
  const now = Date.now()
  const limit = ipRateLimits.get(clientIp)

  // Clean up old entries
  if (limit && now - limit.timestamp > WINDOW_SIZE) {
    ipRateLimits.delete(clientIp)
  }

  // Check and update rate limit
  if (!ipRateLimits.has(clientIp)) {
    ipRateLimits.set(clientIp, { count: 1, timestamp: now })
  } else {
    const current = ipRateLimits.get(clientIp)!
    if (current.count >= MAX_REQUESTS) {
      logger.warn('IP rate limit exceeded', { ip: clientIp })
      return new NextResponse(null, { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0'
        }
      })
    }
    current.count++
  }

  return null
} 