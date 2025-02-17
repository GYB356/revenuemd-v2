import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError, APIError } from '@/lib/api-utils'
import { rateLimiter } from '@/lib/rate-limit'
import { Cache } from '@/lib/cache'
import { logger } from '@/lib/logger'
import type { 
  Claim, 
  PaginatedResponse, 
  CreateClaimRequest 
} from '@/lib/types/api'

const cache = new Cache({ prefix: 'claims:' })

/**
 * @swagger
 * /api/v1/claims:
 *   get:
 *     summary: Get paginated claims list
 *     description: Retrieves a paginated list of claims with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, DENIED]
 *         description: Filter by claim status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for patient name or claim ID
 *     responses:
 *       200:
 *         description: Successfully retrieved claims
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    // Verify authentication
    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Generate cache key
    const cacheKey = `${user.id}:${page}:${limit}:${status}:${search}`

    // Try to get from cache first
    return await cache.wrap(
      cacheKey,
      async () => {
        // Build filters
        const where = {
          ...(status && { status }),
          ...(search && {
            OR: [
              { id: { contains: search } },
              { patient: { name: { contains: search } } },
            ],
          }),
        }

        // Get total count for pagination
        const total = await prisma.claim.count({ where })
        const totalPages = Math.ceil(total / limit)

        // Fetch claims with pagination
        const claims = await prisma.claim.findMany({
          where,
          include: {
            patient: {
              select: {
                name: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })

        const response: PaginatedResponse<Claim[]> = {
          data: claims.map(claim => ({
            ...claim,
            patientName: claim.patient.name,
          })),
          success: true,
          pagination: {
            page,
            limit,
            total,
            pages: totalPages,
          },
        }

        return NextResponse.json(response)
      },
      300 // Cache for 5 minutes
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * @swagger
 * /api/v1/claims:
 *   post:
 *     summary: Create a new claim
 *     description: Creates a new insurance claim
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClaimRequest'
 *     responses:
 *       201:
 *         description: Claim created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    // Verify authentication
    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createClaimSchema.safeParse(body)

    if (!validatedData.success) {
      throw new APIError('Invalid request body', 400, 'VALIDATION_ERROR')
    }

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        ...validatedData.data,
        createdBy: user.id,
        status: 'PENDING',
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    })

    // Invalidate cache
    await cache.delete(`${user.id}:*`)

    // Log activity
    logger.info('Claim created', {
      userId: user.id,
      claimId: claim.id,
      amount: claim.amount,
    })

    return NextResponse.json({
      data: {
        ...claim,
        patientName: claim.patient.name,
      },
      success: true,
      message: 'Claim created successfully',
    }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}

// Schema validation
const createClaimSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  amount: z.number().positive('Amount must be positive'),
  insuranceProvider: z.string().min(1, 'Insurance provider is required'),
  procedureCodes: z.array(z.string()),
  diagnosisCodes: z.array(z.string()),
  notes: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    // Verify authentication
    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    // Get claim ID from URL
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('id')
    if (!claimId) {
      throw new APIError('Claim ID is required', 400)
    }

    // Validate request body
    const body = await request.json()
    const validatedData = claimSchema.safeParse(body)

    if (!validatedData.success) {
      throw new APIError('Invalid request body', 400, 'VALIDATION_ERROR')
    }

    // Update claim
    const claim = await prisma.claim.update({
      where: { id: claimId },
      data: validatedData.data,
      include: {
        patient: {
          select: {
            name: true,
            contactInfo: true,
          },
        },
      },
    })

    // Log activity
    await logUserActivity(user.id, 'CLAIM_UPDATED', {
      claimId: claim.id,
      amount: claim.amount,
    })

    // Invalidate cache
    await cache.delete(`${user.id}:*`)

    return NextResponse.json(claim)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await rateLimiter(request)
    if (rateLimit) return rateLimit

    // Verify authentication
    const user = await AuthService.verifyAuth()
    if (!user) {
      throw new APIError('Unauthorized', 401)
    }

    // Get claim ID from URL
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('id')
    if (!claimId) {
      throw new APIError('Claim ID is required', 400)
    }

    // Delete claim
    await prisma.claim.delete({
      where: { id: claimId },
    })

    // Log activity
    await logUserActivity(user.id, 'CLAIM_DELETED', { claimId })

    // Invalidate cache
    await cache.delete(`${user.id}:*`)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleAPIError(error)
  }
} 