import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError, APIError } from '@/lib/api-utils'
import { rateLimiter } from '@/lib/rate-limit'
import { logUserActivity } from '@/lib/logger'
import { Cache } from '@/lib/cache'

const cache = new Cache({ prefix: 'claims:' })

const processSchema = z.object({
  claimId: z.string().min(1, 'Claim ID is required'),
  status: z.enum(['APPROVED', 'DENIED']),
  reason: z.string().optional(),
  processingNotes: z.string().optional(),
})

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
    const validatedData = processSchema.safeParse(body)

    if (!validatedData.success) {
      throw new APIError('Invalid request body', 400, 'VALIDATION_ERROR')
    }

    const { claimId, status, reason, processingNotes } = validatedData.data

    // Get the claim
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        patient: {
          select: {
            name: true,
            contactInfo: true,
          },
        },
      },
    })

    if (!claim) {
      throw new APIError('Claim not found', 404)
    }

    if (claim.status !== 'PENDING') {
      throw new APIError('Claim has already been processed', 400)
    }

    // Update claim status
    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status,
        fraudCheckDetails: {
          processedAt: new Date(),
          processedBy: user.id,
          reason,
          notes: processingNotes,
        },
      },
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
    await logUserActivity(user.id, `CLAIM_${status}`, {
      claimId,
      amount: claim.amount,
      reason,
    })

    // Invalidate cache
    await cache.delete(`${user.id}:*`)

    // Send notification (implement your notification service)
    // await notificationService.sendClaimStatusUpdate(claim)

    return NextResponse.json({
      message: `Claim ${status.toLowerCase()} successfully`,
      claim: updatedClaim,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

// Batch processing endpoint
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

    // Validate request body
    const body = await request.json()
    const { claimIds, status } = body

    if (!Array.isArray(claimIds) || !claimIds.length) {
      throw new APIError('Claim IDs array is required', 400)
    }

    if (!['APPROVED', 'DENIED'].includes(status)) {
      throw new APIError('Invalid status', 400)
    }

    // Update claims in batch
    const updatedClaims = await prisma.$transaction(
      claimIds.map((claimId) =>
        prisma.claim.update({
          where: { 
            id: claimId,
            status: 'PENDING', // Only update pending claims
          },
          data: {
            status,
            fraudCheckDetails: {
              processedAt: new Date(),
              processedBy: user.id,
              notes: 'Batch processed',
            },
          },
        })
      )
    )

    // Log activity
    await logUserActivity(user.id, 'CLAIMS_BATCH_PROCESSED', {
      claimIds,
      status,
      count: updatedClaims.length,
    })

    // Invalidate cache
    await cache.delete(`${user.id}:*`)

    return NextResponse.json({
      message: `${updatedClaims.length} claims processed successfully`,
      claims: updatedClaims,
    })
  } catch (error) {
    return handleAPIError(error)
  }
} 