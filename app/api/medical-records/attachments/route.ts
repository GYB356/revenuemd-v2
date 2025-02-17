import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { supabase } from "@/lib/supabase"
import { getMedicalRecord, updateMedicalRecord } from "@/lib/mongodb"
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const patientId = formData.get("patientId") as string

    if (!file || !patientId) {
      return NextResponse.json(
        { error: "File and patient ID are required" },
        { status: 400 }
      )
    }

    // Verify the patient exists and belongs to the user
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${patientId}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medical-records")
      .upload(fileName, file)

    if (uploadError) {
      console.error("Failed to upload file:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("medical-records")
      .getPublicUrl(fileName)

    // Add attachment to medical record
    const medicalRecord = await getMedicalRecord(patientId)
    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    const attachment = {
      name: file.name,
      type: file.type,
      url: publicUrl,
      uploadDate: new Date(),
    }

    await updateMedicalRecord(patientId, {
      attachments: [...(medicalRecord.attachments || []), attachment],
    })

    // Log activity
    await logActivity({
      userId: user.id,
      type: "UPDATE_MEDICAL_RECORD",
      details: `Added attachment ${file.name} to medical record`,
      metadata: {
        patientId,
        fileName: file.name,
        fileType: file.type,
      },
    })

    return NextResponse.json({
      success: true,
      attachment,
    })
  } catch (error) {
    console.error("Failed to handle attachment:", error)
    return NextResponse.json(
      { error: "Failed to handle attachment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { patientId, fileName } = await request.json()

    if (!patientId || !fileName) {
      return NextResponse.json(
        { error: "Patient ID and file name are required" },
        { status: 400 }
      )
    }

    // Verify the patient exists and belongs to the user
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId: user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Delete file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from("medical-records")
      .remove([`${patientId}/${fileName}`])

    if (deleteError) {
      console.error("Failed to delete file:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      )
    }

    // Update medical record
    const medicalRecord = await getMedicalRecord(patientId)
    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    const updatedAttachments = medicalRecord.attachments.filter(
      (att) => att.name !== fileName
    )

    await updateMedicalRecord(patientId, {
      attachments: updatedAttachments,
    })

    // Log activity
    await logActivity({
      userId: user.id,
      type: "UPDATE_MEDICAL_RECORD",
      details: `Removed attachment ${fileName} from medical record`,
      metadata: {
        patientId,
        fileName,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete attachment:", error)
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    )
  }
} 