import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { logActivity } from "@/lib/activity-logger"

const bulkUpdateSchema = z.object({
  claimIds: z.array(z.string()),
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  notes: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can perform bulk updates" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = bulkUpdateSchema.parse(body)

    // Get current claims to validate status transitions
    const currentClaims = await prisma.claim.findMany({
      where: {
        id: { in: validatedData.claimIds },
      },
      select: {
        id: true,
        status: true,
      },
    })

    // Validate status transitions
    const invalidTransitions = currentClaims.filter(claim => {
      // Can't change from APPROVED/DENIED back to PENDING
      if ((claim.status === "APPROVED" || claim.status === "DENIED") && 
          validatedData.status === "PENDING") {
        return true
      }
      // Can't change from DENIED to APPROVED or vice versa
      if ((claim.status === "APPROVED" && validatedData.status === "DENIED") ||
          (claim.status === "DENIED" && validatedData.status === "APPROVED")) {
        return true
      }
      return false
    })

    if (invalidTransitions.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid status transitions",
          details: invalidTransitions.map(c => c.id),
        },
        { status: 400 }
      )
    }

    // Perform bulk update
    const updateResult = await prisma.claim.updateMany({
      where: {
        id: { in: validatedData.claimIds },
        // Only update claims that can transition to the new status
        status: validatedData.status === "PENDING" ? "PENDING" :
                validatedData.status === "APPROVED" ? "PENDING" :
                "PENDING",
      },
      data: {
        status: validatedData.status,
        notes: validatedData.notes ? {
          push: {
            content: validatedData.notes,
            author: user.email,
            date: new Date(),
          },
        } : undefined,
      },
    })

    // Log activity
    await logActivity({
      userId: user.id,
      type: "UPDATE_CLAIM",
      details: `Bulk updated ${updateResult.count} claims to status ${validatedData.status}`,
      metadata: {
        claimIds: validatedData.claimIds,
        newStatus: validatedData.status,
        updatedCount: updateResult.count,
      },
    })

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to perform bulk update:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk update" },
      { status: 500 }
    )
  }
} 