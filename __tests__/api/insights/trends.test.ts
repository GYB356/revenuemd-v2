import { NextRequest } from 'next/server'
import { GET } from '@/app/api/insights/trends/route'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    patient: {
      findMany: jest.fn(),
    },
    claim: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}))

jest.mock('@/lib/activity-logger', () => ({
  logActivity: jest.fn(),
}))

describe('Trends API', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  }

  const mockPatients = [
    {
      createdAt: new Date('2024-01-01'),
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
    },
    {
      createdAt: new Date('2024-02-01'),
      gender: 'FEMALE',
      dateOfBirth: new Date('1985-01-01'),
    },
  ]

  const mockClaims = [
    {
      createdAt: new Date('2024-01-15'),
      status: 'APPROVED',
      amount: 1000,
      procedureCodes: ['PROC1'],
    },
    {
      createdAt: new Date('2024-02-15'),
      status: 'APPROVED',
      amount: 1500,
      procedureCodes: ['PROC2'],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findMany as jest.Mock).mockResolvedValue(mockPatients)
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims)
  })

  it('returns trends data for authenticated users', async () => {
    const req = new NextRequest('http://localhost/api/insights/trends')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('patientTrends')
    expect(data).toHaveProperty('claimsTrends')
    expect(data).toHaveProperty('revenueTrends')
    expect(data).toHaveProperty('patientGrowth')
    expect(data).toHaveProperty('revenueGrowth')
    expect(data).toHaveProperty('demographics')
    expect(data).toHaveProperty('topProcedures')

    expect(logActivity).toHaveBeenCalledWith({
      userId: mockUser.id,
      type: 'VIEW_INSIGHTS',
      details: 'Viewed trends insights',
    })
  })

  it('returns 401 for unauthenticated users', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/insights/trends')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('returns 500 when database query fails', async () => {
    ;(prisma.patient.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))
    const req = new NextRequest('http://localhost/api/insights/trends')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to get trends insights' })
  })

  it('calculates trends correctly', async () => {
    const req = new NextRequest('http://localhost/api/insights/trends')
    const response = await GET(req)
    const data = await response.json()

    // Verify patient trends calculations
    expect(data.patientTrends).toHaveLength(12) // Last 12 months
    expect(data.patientTrends[0]).toHaveProperty('newPatients')
    expect(data.patientTrends[0]).toHaveProperty('totalPatients')

    // Verify claims trends calculations
    expect(data.claimsTrends).toHaveLength(12)
    expect(data.claimsTrends[0]).toHaveProperty('claims')
    expect(data.claimsTrends[0]).toHaveProperty('revenue')

    // Verify demographics calculations
    expect(data.demographics.byGender).toHaveProperty('MALE')
    expect(data.demographics.byGender).toHaveProperty('FEMALE')
    expect(Object.keys(data.demographics.byAgeGroup).length).toBeGreaterThan(0)

    // Verify top procedures
    expect(data.topProcedures).toHaveLength(2)
    expect(data.topProcedures[0]).toHaveProperty('name')
    expect(data.topProcedures[0]).toHaveProperty('count')
    expect(data.topProcedures[0]).toHaveProperty('revenue')
  })
}) 