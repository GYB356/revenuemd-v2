import { prisma } from "@/lib/db"
import { getMedicalRecord } from "@/lib/mongodb"
import type { PatientInsights, HealthMetrics, ClaimsAnalysis } from "./index"

export async function getPatientInsights(patientId: string): Promise<PatientInsights> {
  // Get medical record data
  const medicalRecord = await getMedicalRecord(patientId)
  
  // Calculate health metrics
  const healthMetrics: HealthMetrics = {
    activeConditions: medicalRecord?.conditions?.filter(c => c.status === 'active').length || 0,
    activeMedications: medicalRecord?.medications?.filter(m => !m.endDate || new Date(m.endDate) > new Date()).length || 0,
    allergies: medicalRecord?.allergies?.length || 0,
    lastCheckup: medicalRecord?.procedures?.filter(p => 
      p.name.toLowerCase().includes('checkup') || 
      p.name.toLowerCase().includes('examination')
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date,
  }

  // Get claims data
  const claims = await prisma.claim.findMany({
    where: { patientId },
  })

  // Calculate claims analysis
  const claimsAnalysis: ClaimsAnalysis = {
    totalClaims: claims.length,
    approvedClaims: claims.filter(c => c.status === 'APPROVED').length,
    deniedClaims: claims.filter(c => c.status === 'DENIED').length,
    totalAmount: claims.reduce((sum, claim) => sum + Number(claim.amount), 0),
  }

  // Calculate risk score based on various factors
  let riskScore = 0

  // Factor 1: Active conditions (each active condition adds 10 points)
  riskScore += healthMetrics.activeConditions * 10

  // Factor 2: Active medications (each medication adds 5 points)
  riskScore += healthMetrics.activeMedications * 5

  // Factor 3: Recent claims history (denied claims increase risk)
  const recentClaims = claims.filter(c => 
    new Date(c.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
  )
  const deniedClaimsRatio = recentClaims.length > 0 
    ? recentClaims.filter(c => c.status === 'DENIED').length / recentClaims.length 
    : 0
  riskScore += deniedClaimsRatio * 30

  // Factor 4: Time since last checkup
  if (healthMetrics.lastCheckup) {
    const daysSinceLastCheckup = Math.floor(
      (Date.now() - new Date(healthMetrics.lastCheckup).getTime()) / (24 * 60 * 60 * 1000)
    )
    if (daysSinceLastCheckup > 365) { // More than a year
      riskScore += 20
    } else if (daysSinceLastCheckup > 180) { // More than 6 months
      riskScore += 10
    }
  } else {
    riskScore += 30 // No checkup record
  }

  // Normalize risk score to 0-100 range
  riskScore = Math.min(100, Math.max(0, riskScore))

  return {
    healthMetrics,
    claimsAnalysis,
    riskScore,
  }
}