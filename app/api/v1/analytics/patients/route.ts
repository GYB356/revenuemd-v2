import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError, APIError } from '@/lib/api-utils'
import { rateLimiter } from '@/lib/rate-limit'
import { Cache } from '@/lib/cache'

const cache = new Cache({ prefix: 'patients:' })

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    })

    if (!query.success) {
      throw new APIError('Invalid parameters', 400)
    }

    const { startDate, endDate } = query.data

    // Generate cache key based on query parameters
    const cacheKey = `${user.id}:${startDate || ''}:${endDate || ''}`

    // Try to get from cache first
    return await cache.wrap(
      cacheKey,
      async () => {
        // Build date filter
        const dateFilter = startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {}

        // Fetch patients data
        const patients = await prisma.patient.findMany({
          where: dateFilter,
          select: {
            id: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            createdAt: true
          }
        })

        // Calculate total and new patients
        const totalPatients = await prisma.patient.count()
        const newPatients = patients.length

        // Calculate active patients (patients with claims in the period)
        const activePatientsCount = await prisma.claim.groupBy({
          by: ['patientId'],
          where: dateFilter,
          _count: true
        }).then(groups => groups.length)

        // Calculate demographics
        const demographics = calculateDemographics(patients)

        return NextResponse.json({
          totalPatients,
          newPatients,
          activePatients: activePatientsCount,
          demographics
        })
      },
      300 // Cache for 5 minutes
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

function calculateDemographics(patients: Array<{
  dateOfBirth: Date
  gender: string
  address: string
}>) {
  // Calculate age groups
  const now = new Date()
  const ageGroups = patients.reduce((acc, patient) => {
    const age = now.getFullYear() - patient.dateOfBirth.getFullYear()
    const group = getAgeGroup(age)
    acc[group] = (acc[group] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate gender distribution
  const gender = patients.reduce((acc, patient) => {
    acc[patient.gender] = (acc[patient.gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate location distribution
  const location = patients.reduce((acc, patient) => {
    try {
      const address = JSON.parse(patient.address)
      const state = address.state
      if (state) {
        acc[state] = (acc[state] || 0) + 1
      }
    } catch (e) {
      // Skip invalid address data
    }
    return acc
  }, {} as Record<string, number>)

  return {
    ageGroups,
    gender,
    location
  }
}

function getAgeGroup(age: number): string {
  if (age <= 18) return '0-18'
  if (age <= 30) return '19-30'
  if (age <= 50) return '31-50'
  return '51+'
} 