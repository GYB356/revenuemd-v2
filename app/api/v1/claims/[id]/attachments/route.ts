import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { claimsService } from "@/lib/claims/claims-service"
import { AttachmentService } from "@/lib/services/attachment-service"
import { logActivity } from "@/lib/activity-logger"
import { validateFiles } from "@/lib/validation/file-validation"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const claim = await claimsService.getClaim(params.id)
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Check if user has access to this claim
    if (session.user.role !== "ADMIN" && claim.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    // Validate files
    const validationError = validateFiles(files)
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message, details: validationError },
        { status: 400 }
      )
    }

    // Upload files
    const attachments = await Promise.all(
      files.map(file =>
        AttachmentService.upload({
          file,
          entityType: "CLAIM",
          entityId: params.id,
          userId: session.user.id,
        })
      )
    )

    // Log activity
    await logActivity({
      userId: session.user.id,
      type: "UPDATE_CLAIM",
      details: `Added ${files.length} attachments to claim ${params.id}`,
      metadata: {
        claimId: params.id,
        attachmentCount: files.length,
        attachmentNames: files.map(f => f.name),
      },
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Failed to upload attachments:", error)
    return NextResponse.json(
      { error: "Failed to upload attachments" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const claim = await claimsService.getClaim(params.id)
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Check if user has access to this claim
    if (session.user.role !== "ADMIN" && claim.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const attachments = await AttachmentService.getAttachments("CLAIM", params.id)
    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Failed to fetch attachments:", error)
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const claim = await claimsService.getClaim(params.id)
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Check if user has access to this claim
    if (session.user.role !== "ADMIN" && claim.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const attachmentId = searchParams.get("attachmentId")
    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      )
    }

    await AttachmentService.delete({
      id: attachmentId,
      uploadedBy: session.user.id,
    })

    // Log activity
    await logActivity({
      userId: session.user.id,
      type: "UPDATE_CLAIM",
      details: `Deleted attachment from claim ${params.id}`,
      metadata: {
        claimId: params.id,
        attachmentId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete attachment:", error)
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    )
  }
} 