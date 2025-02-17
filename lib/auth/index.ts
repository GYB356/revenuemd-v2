import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { z } from 'zod'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
)

export interface AuthUser {
  id: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  name?: string
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export class AuthService {
  private static readonly TOKEN_PREFIX = 'token:'
  private static readonly SESSION_TTL = 24 * 60 * 60 // 24 hours

  static async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    try {
      // Validate input
      loginSchema.parse({ email, password })

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          password: true,
        },
      })

      if (!user) {
        throw new Error('Invalid credentials')
      }

      // Verify password (implement proper password hashing)
      const isValidPassword = await this.verifyPassword(password, user.password)
      if (!isValidPassword) {
        throw new Error('Invalid credentials')
      }

      // Generate token
      const token = await this.generateToken(user)

      // Store token in Redis
      await this.storeToken(token, user.id)

      const { password: _, ...userWithoutPassword } = user
      return { token, user: userWithoutPassword }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  static async logout(token: string): Promise<void> {
    try {
      await redis.del(`${this.TOKEN_PREFIX}${token}`)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  static async verifyAuth(request: NextRequest): Promise<AuthUser | null> {
    try {
      const token = this.extractToken(request)
      if (!token) return null

      // Verify token is still valid in Redis
      const userId = await redis.get(`${this.TOKEN_PREFIX}${token}`)
      if (!userId) return null

      // Verify JWT
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      // Get fresh user data
      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      })

      return user
    } catch (error) {
      console.error('Auth verification error:', error)
      return null
    }
  }

  static async refreshToken(token: string): Promise<string | null> {
    try {
      const userId = await redis.get(`${this.TOKEN_PREFIX}${token}`)
      if (!userId) return null

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      })

      if (!user) return null

      // Generate new token
      const newToken = await this.generateToken(user)

      // Update Redis
      await this.storeToken(newToken, user.id)
      await redis.del(`${this.TOKEN_PREFIX}${token}`)

      return newToken
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  private static async generateToken(user: Partial<AuthUser>): Promise<string> {
    return new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)
  }

  private static async storeToken(token: string, userId: string): Promise<void> {
    await redis.setex(
      `${this.TOKEN_PREFIX}${token}`,
      this.SESSION_TTL,
      userId
    )
  }

  private static extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    return authHeader.split(' ')[1]
  }

  private static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    // Implement proper password verification here
    return plainPassword === hashedPassword // This is just for demonstration
  }
} 