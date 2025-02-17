import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/claims/route'
import { prismaMock } from '../setup'
import { mockUser } from '../mocks/auth'

describe('Claims API', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('GET /api/claims', () => {
    it('should return unauthorized for unauthenticated requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return claims for authenticated requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        cookies: {
          token: 'valid_token'
        }
      })

      // Mock auth verification
      vi.mock('@/lib/auth', () => ({
        verifyAuth: () => Promise.resolve(mockUser)
      }))

      // Mock Prisma response
      prismaMock.claim.findMany.mockResolvedValue([
        {
          id: '1',
          patientId: '1',
          amount: 100,
          status: 'PENDING',
          isFraudulent: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          patient: {
            name: 'John Doe'
          }
        }
      ])

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].patient.name).toBe('John Doe')
    })

    it('should handle database errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        cookies: {
          token: 'valid_token'
        }
      })

      // Mock auth verification
      vi.mock('@/lib/auth', () => ({
        verifyAuth: () => Promise.resolve(mockUser)
      }))

      // Mock Prisma error
      prismaMock.claim.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch claims')
    })
  })

  describe('POST /api/claims', () => {
    it('should create a new claim with valid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        cookies: {
          token: 'valid_token'
        },
        body: {
          patientId: '1',
          claimAmount: '100',
          procedureCodes: 'CODE1',
        }
      })

      // Mock auth verification
      vi.mock('@/lib/auth', () => ({
        verifyAuth: () => Promise.resolve(mockUser)
      }))

      // Mock patient existence check
      prismaMock.patient.findUnique.mockResolvedValue({
        id: '1',
        name: 'John Doe',
        // ... other patient fields
      })

      // Mock claim creation
      prismaMock.claim.create.mockResolvedValue({
        id: '1',
        patientId: '1',
        amount: 100,
        status: 'PENDING',
        isFraudulent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: {
          name: 'John Doe'
        }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
      expect(data.amount).toBe(100)
    })

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        cookies: {
          token: 'valid_token'
        },
        body: {
          // Missing required fields
        }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })
}) 