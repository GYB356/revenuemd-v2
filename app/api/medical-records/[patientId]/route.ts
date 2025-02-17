import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMedicalRecord, updateMedicalRecord, deleteMedicalRecord } from "@/lib/mongodb"
import { z } from "zod"
import { logActivity } from "@/lib/activity-logger"

const updateMedicalRecordSchema = z.object({
  history: z.any().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
  })).optional(),
  conditions: z.array(z.object({
    name: z.string(),
    diagnosisDate: z.string(),
    status: z.enum(["active", "resolved"]),
    notes: z.string().optional(),
  })).optional(),
  procedures: z.array(z.object({
    name: z.string(),
    date: z.string(),
    provider: z.string(),
    notes: z.string().optional(),
  })).optional(),
  vitals: z.array(z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string(),
    date: z.string(),
  })).optional(),
  notes: z.array(z.object({
    content: z.string(),
    author: z.string(),
    date: z.string(),
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadDate: z.string(),
  })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify the patient exists and belongs to the user
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.patientId,
        userId: user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    const medicalRecord = await getMedicalRecord(params.patientId)
    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(medicalRecord)
  } catch (error) {
    console.error("Failed to fetch medical record:", error)
    return NextResponse.json(
      { error: "Failed to fetch medical record" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify the patient exists and belongs to the user
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.patientId,
        userId: user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateMedicalRecordSchema.parse(body)

    // Convert date strings to Date objects
    const processedData = {
      ...validatedData,
      medications: validatedData.medications?.map(med => ({
        ...med,
        startDate: new Date(med.startDate),
        endDate: med.endDate ? new Date(med.endDate) : undefined,
      })),
      conditions: validatedData.conditions?.map(cond => ({
        ...cond,
        diagnosisDate: new Date(cond.diagnosisDate),
      })),
      procedures: validatedData.procedures?.map(proc => ({
        ...proc,
        date: new Date(proc.date),
      })),
      vitals: validatedData.vitals?.map(vital => ({
        ...vital,
        date: new Date(vital.date),
      })),
      notes: validatedData.notes?.map(note => ({
        ...note,
        date: new Date(note.date),
      })),
      attachments: validatedData.attachments?.map(att => ({
        ...att,
        uploadDate: new Date(att.uploadDate),
      })),
    }

    const result = await updateMedicalRecord(params.patientId, processedData)
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    // Log the activity
    await logActivity({
      userId: user.id,
      type: "UPDATE_MEDICAL_RECORD",
      details: `Updated medical record for patient ${params.patientId}`,
      metadata: {
        patientId: params.patientId,
        updatedFields: Object.keys(validatedData),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update medical record:", error)
    return NextResponse.json(
      { error: "Failed to update medical record" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
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
        { error: "Only administrators can delete medical records" },
        { status: 403 }
      )
    }

    // Verify the patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    const result = await deleteMedicalRecord(params.patientId)
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    // Update the patient record to remove the medical record reference
    await prisma.patient.update({
      where: { id: params.patientId },
      data: { medicalRecordId: null },
    })

    // Log the activity
    await logActivity({
      userId: user.id,
      type: "DELETE_MEDICAL_RECORD",
      details: `Deleted medical record for patient ${params.patientId}`,
      metadata: {
        patientId: params.patientId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete medical record:", error)
    return NextResponse.json(
      { error: "Failed to delete medical record" },
      { status: 500 }
    )
  }
} 