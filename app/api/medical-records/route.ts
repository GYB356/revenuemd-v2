import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createMedicalRecord } from "@/lib/mongodb"
import { z } from "zod"
import { logActivity } from "@/lib/activity-logger"

const createMedicalRecordSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  history: z.any(),
  allergies: z.array(z.string()),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
  })),
  conditions: z.array(z.object({
    name: z.string(),
    diagnosisDate: z.string(),
    status: z.enum(["active", "resolved"]),
    notes: z.string().optional(),
  })),
  procedures: z.array(z.object({
    name: z.string(),
    date: z.string(),
    provider: z.string(),
    notes: z.string().optional(),
  })),
  vitals: z.array(z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string(),
    date: z.string(),
  })),
  notes: z.array(z.object({
    content: z.string(),
    author: z.string(),
    date: z.string(),
  })),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadDate: z.string(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createMedicalRecordSchema.parse(body)

    // Verify the patient exists and belongs to the user
    const patient = await prisma.patient.findFirst({
      where: {
        id: validatedData.patientId,
        userId: user.id,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Check if medical record already exists
    if (patient.medicalRecordId) {
      return NextResponse.json(
        { error: "Medical record already exists for this patient" },
        { status: 400 }
      )
    }

    // Convert date strings to Date objects
    const processedData = {
      ...validatedData,
      medications: validatedData.medications.map(med => ({
        ...med,
        startDate: new Date(med.startDate),
        endDate: med.endDate ? new Date(med.endDate) : undefined,
      })),
      conditions: validatedData.conditions.map(cond => ({
        ...cond,
        diagnosisDate: new Date(cond.diagnosisDate),
      })),
      procedures: validatedData.procedures.map(proc => ({
        ...proc,
        date: new Date(proc.date),
      })),
      vitals: validatedData.vitals.map(vital => ({
        ...vital,
        date: new Date(vital.date),
      })),
      notes: validatedData.notes.map(note => ({
        ...note,
        date: new Date(note.date),
      })),
      attachments: validatedData.attachments.map(att => ({
        ...att,
        uploadDate: new Date(att.uploadDate),
      })),
    }

    const result = await createMedicalRecord(processedData)

    // Update patient with medical record reference
    await prisma.patient.update({
      where: { id: validatedData.patientId },
      data: { medicalRecordId: result.insertedId.toString() },
    })

    // Log the activity
    await logActivity({
      userId: user.id,
      type: "CREATE_MEDICAL_RECORD",
      details: `Created medical record for patient ${validatedData.patientId}`,
      metadata: {
        patientId: validatedData.patientId,
        medicalRecordId: result.insertedId.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      medicalRecordId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to create medical record:", error)
    return NextResponse.json(
      { error: "Failed to create medical record" },
      { status: 500 }
    )
  }
} 