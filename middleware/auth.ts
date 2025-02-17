import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { rateLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
]

// Role-based route access
const roleRoutes = {
  ADMIN: ['/admin', '/api/admin'],
  USER: ['/dashboard', '/api/v1'],
}

export async function authMiddleware(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url)

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    // Verify CSRF token for mutations
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      const expectedToken = request.cookies.get('csrf-token')?.value

      if (!csrfToken || !expectedToken || csrfToken !== expectedToken) {
        logger.warn('CSRF token validation failed', {
          path: pathname,
          ip: request.ip,
        })
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access
    const userRole = payload.role as keyof typeof roleRoutes
    const allowedRoutes = roleRoutes[userRole] || []

    if (!allowedRoutes.some(route => pathname.startsWith(route))) {
      logger.warn('Unauthorized access attempt', {
        path: pathname,
        role: userRole,
        userId: payload.id,
      })
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id)
    requestHeaders.set('x-user-role', userRole)

    return NextResponse.next({
      headers: requestHeaders,
    })
  } catch (error) {
    logger.error('Auth middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Apply middleware to all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}