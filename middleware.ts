import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { handleError } from '@/lib/error-handler'
import { checkRateLimit } from '@/lib/middleware/rate-limit'

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/health',
]

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

export async function middleware(request: NextRequest) {
  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: { ...CORS_HEADERS },
      })
    }

    const path = request.nextUrl.pathname

    // Skip middleware for static files and Next.js internals
    if (
      path.startsWith('/_next') ||
      path.startsWith('/static') ||
      path.includes('.')
    ) {
      return NextResponse.next()
    }

    // Check authentication for non-public paths
    let user = null
    if (!PUBLIC_PATHS.some(p => path.startsWith(p))) {
      user = await verifyAuth(request)
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Apply rate limiting
    if (path.startsWith('/api')) {
      const rateLimit = await checkRateLimit(request, user?.id)
      if (rateLimit instanceof NextResponse) {
        return rateLimit
      }
    }

    // Log activity for important operations
    if (user && request.method !== 'GET') {
      const activityType = getActivityType(request.method, path)
      if (activityType) {
        await logActivity({
          userId: user.id,
          type: activityType,
          details: `${request.method} ${path}`,
          metadata: {
            userAgent: request.headers.get('user-agent'),
            path,
            method: request.method,
          },
        })
      }
    }

    // Continue with the request
    const response = NextResponse.next()

    // Add security headers
    Object.entries({ ...SECURITY_HEADERS, ...CORS_HEADERS }).forEach(
      ([header, value]) => {
        response.headers.set(header, value)
      }
    )

    return response
  } catch (error) {
    return handleError(error)
  }
}

function getActivityType(method: string, path: string): string | null {
  const patterns = {
    '/api/patients': {
      POST: 'CREATE_PATIENT',
      PUT: 'UPDATE_PATIENT',
      DELETE: 'DELETE_PATIENT',
    },
    '/api/claims': {
      POST: 'CREATE_CLAIM',
      PUT: 'UPDATE_CLAIM',
      DELETE: 'DELETE_CLAIM',
    },
    '/api/medical-records': {
      POST: 'CREATE_MEDICAL_RECORD',
      PUT: 'UPDATE_MEDICAL_RECORD',
      DELETE: 'DELETE_MEDICAL_RECORD',
    },
    '/api/export': {
      GET: 'EXPORT_DATA',
    },
  }

  for (const [pattern, actions] of Object.entries(patterns)) {
    if (path.startsWith(pattern)) {
      return actions[method as keyof typeof actions] || null
    }
  }

  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}