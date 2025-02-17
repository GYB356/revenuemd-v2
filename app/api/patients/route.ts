import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateSummary, generateInsights } from "@/lib/ai"
import { getFromCache, setInCache } from "@/lib/cache"
import type { NextRequest } from "next/server"
import { z } from "zod"

const patientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.date(),
  gender: z.enum(["male", "female", "other"]),
  contactInfo: z.string().min(10).max(15),
  medicalHistory: z.array(z.string()),
})

export async function GET() {
  const cacheKey = "patients"
  const cachedPatients = await getFromCache(cacheKey)

  if (cachedPatients) {
    return NextResponse.json(cachedPatients)
  }

  const patients = await prisma.patient.findMany()
  await setInCache(cacheKey, patients, 300) // Cache for 5 minutes
  return NextResponse.json(patients)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = patientSchema.parse(body)

    const summary = await generateSummary(validatedData.medicalHistory.join(", "))
    const insights = await generateInsights(validatedData.medicalHistory.join(", "))

    const patient = await prisma.patient.create({
      data: {
        userId: "user-id", // Replace with authenticated user ID
        name: validatedData.name,
        dateOfBirth: validatedData.dateOfBirth,
        gender: validatedData.gender,
        contactInfo: validatedData.contactInfo,
        medicalHistory: validatedData.medicalHistory.join(","),
        summary,
        insights,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}

