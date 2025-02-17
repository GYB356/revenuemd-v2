import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMedicalRecord } from "@/lib/mongodb"
import OpenAI from "openai"
import { z } from "zod"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const requestSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  type: z.enum(["summary", "prediction", "recommendation"]),
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
    const { patientId, type } = requestSchema.parse(body)

    // Get patient data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        claims: true,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Get medical record from MongoDB
    const medicalRecord = await getMedicalRecord(patientId)
    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    // Prepare data for AI analysis
    const patientData = {
      ...patient,
      medicalHistory: medicalRecord.history,
      conditions: medicalRecord.conditions,
      medications: medicalRecord.medications,
      procedures: medicalRecord.procedures,
      vitals: medicalRecord.vitals,
    }

    let prompt = ""
    switch (type) {
      case "summary":
        prompt = generateSummaryPrompt(patientData)
        break
      case "prediction":
        prompt = generatePredictionPrompt(patientData)
        break
      case "recommendation":
        prompt = generateRecommendationPrompt(patientData)
        break
    }

    // Get AI insights
    const completion = await openai.chat.completions.create({
      model: type === "prediction" ? "gpt-4" : "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant analyzing patient data to provide insights. Be thorough but concise.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const insight = completion.choices[0].message.content

    // Store the insight in the database
    await prisma.log.create({
      data: {
        userId: user.id,
        action: `GENERATE_${type.toUpperCase()}_INSIGHT`,
        details: `Generated ${type} insight for patient ${patientId}`,
      },
    })

    return NextResponse.json({
      insight,
      type,
      generatedAt: new Date(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("AI insight generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    )
  }
}

function generateSummaryPrompt(patientData: any): string {
  return `
    Please provide a concise summary of the patient's medical history and current status:
    
    Patient Information:
    - Age: ${calculateAge(patientData.dateOfBirth)}
    - Gender: ${patientData.gender}
    
    Medical History:
    ${JSON.stringify(patientData.medicalHistory)}
    
    Current Conditions:
    ${JSON.stringify(patientData.conditions)}
    
    Current Medications:
    ${JSON.stringify(patientData.medications)}
    
    Recent Procedures:
    ${JSON.stringify(patientData.procedures)}
    
    Recent Vitals:
    ${JSON.stringify(patientData.vitals)}
    
    Please analyze this information and provide:
    1. A brief overview of the patient's health status
    2. Key medical conditions and their current status
    3. Important medications and their purposes
    4. Any significant trends in vital signs
  `
}

function generatePredictionPrompt(patientData: any): string {
  return `
    Based on the patient's medical history and current status, please provide predictions about:
    
    Patient Information:
    - Age: ${calculateAge(patientData.dateOfBirth)}
    - Gender: ${patientData.gender}
    
    Medical History:
    ${JSON.stringify(patientData.medicalHistory)}
    
    Current Conditions:
    ${JSON.stringify(patientData.conditions)}
    
    Current Medications:
    ${JSON.stringify(patientData.medications)}
    
    Recent Procedures:
    ${JSON.stringify(patientData.procedures)}
    
    Recent Vitals:
    ${JSON.stringify(patientData.vitals)}
    
    Please analyze this information and provide:
    1. Potential health risks based on current conditions and history
    2. Recommended preventive measures
    3. Projected outcomes if current trends continue
    4. Suggestions for lifestyle modifications
  `
}

function generateRecommendationPrompt(patientData: any): string {
  return `
    Please provide medical recommendations based on the patient's current status:
    
    Patient Information:
    - Age: ${calculateAge(patientData.dateOfBirth)}
    - Gender: ${patientData.gender}
    
    Medical History:
    ${JSON.stringify(patientData.medicalHistory)}
    
    Current Conditions:
    ${JSON.stringify(patientData.conditions)}
    
    Current Medications:
    ${JSON.stringify(patientData.medications)}
    
    Recent Procedures:
    ${JSON.stringify(patientData.procedures)}
    
    Recent Vitals:
    ${JSON.stringify(patientData.vitals)}
    
    Please provide recommendations regarding:
    1. Medication adjustments or alternatives
    2. Lifestyle modifications
    3. Preventive care measures
    4. Follow-up appointments or tests
    5. Dietary considerations
  `
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
} 