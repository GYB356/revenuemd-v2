import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    )
  }
} 