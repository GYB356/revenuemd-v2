import { prisma } from "@/lib/db"
import { getMedicalRecord } from "@/lib/mongodb"

interface FraudCheckResult {
  isFraudulent: boolean
  reasons: string[]
  riskScore: number
}

export async function checkClaimForFraud(
  patientId: string,
  claimAmount: number,
  procedureCodes: string[],
  diagnosisCodes: string[]
): Promise<FraudCheckResult> {
  const reasons: string[] = []
  let riskScore = 0

  // Get patient's medical record
  const medicalRecord = await getMedicalRecord(patientId)
  if (!medicalRecord) {
    return {
      isFraudulent: true,
      reasons: ["No medical record found for patient"],
      riskScore: 1,
    }
  }

  // Get patient's recent claims
  const recentClaims = await prisma.claim.findMany({
    where: {
      patientId,
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Check for unusually high claim amount
  const averageClaimAmount = recentClaims.length > 0
    ? recentClaims.reduce((sum, claim) => sum + Number(claim.amount), 0) / recentClaims.length
    : 0

  if (claimAmount > averageClaimAmount * 3) {
    reasons.push("Unusually high claim amount")
    riskScore += 0.3
  }

  // Check for frequent claims
  if (recentClaims.length > 10) {
    reasons.push("High frequency of claims")
    riskScore += 0.2
  }

  // Check for duplicate procedure codes in recent claims
  const recentProcedureCodes = recentClaims.flatMap(claim => claim.procedureCodes)
  const duplicateProcedures = procedureCodes.filter(code =>
    recentProcedureCodes.includes(code)
  )

  if (duplicateProcedures.length > 0) {
    reasons.push("Duplicate procedures within 90 days")
    riskScore += 0.25
  }

  // Check for diagnosis code and procedure code mismatch
  const validProcedureDiagnosisPairs = {
    "99213": ["I10", "E11"], // Example: Office visit codes with hypertension/diabetes
    "99214": ["I10", "E11"],
    "J1100": ["M25.5"], // Example: Injection procedures with joint pain
  }

  const hasInvalidPairing = procedureCodes.some(procCode => {
    const validDiagnoses = validProcedureDiagnosisPairs[procCode as keyof typeof validProcedureDiagnosisPairs]
    return validDiagnoses && !diagnosisCodes.some(diagCode => validDiagnoses.includes(diagCode))
  })

  if (hasInvalidPairing) {
    reasons.push("Procedure and diagnosis code mismatch")
    riskScore += 0.25
  }

  // Check for procedures without related conditions in medical record
  const patientConditions = medicalRecord.conditions.map(c => c.name.toLowerCase())
  const procedureConditionMap = {
    "99213": ["hypertension", "diabetes"],
    "J1100": ["joint pain", "arthritis"],
  }

  const hasUnrelatedProcedure = procedureCodes.some(procCode => {
    const relatedConditions = procedureConditionMap[procCode as keyof typeof procedureConditionMap]
    return relatedConditions && !relatedConditions.some(cond =>
      patientConditions.some(patientCond => patientCond.includes(cond))
    )
  })

  if (hasUnrelatedProcedure) {
    reasons.push("Procedures without related conditions in medical record")
    riskScore += 0.2
  }

  return {
    isFraudulent: riskScore >= 0.5,
    reasons,
    riskScore,
  }
} 