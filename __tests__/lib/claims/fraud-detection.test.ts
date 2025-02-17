import { checkClaimForFraud } from "@/lib/claims/fraud-detection"
import { prisma } from "@/lib/db"
import { getMedicalRecord } from "@/lib/mongodb"
import { expect, jest, describe, it, beforeEach } from "@jest/globals"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/mongodb")

describe("Fraud Detection", () => {
  const mockPatientId = "patient-1"
  const mockMedicalRecord = {
    conditions: [
      { name: "Hypertension", diagnosisDate: new Date(), status: "active" },
      { name: "Type 2 Diabetes", diagnosisDate: new Date(), status: "active" },
    ],
  }

  const mockRecentClaims = [
    {
      id: "claim-1",
      amount: 100,
      procedureCodes: ["99213"],
      diagnosisCodes: ["I10"],
      createdAt: new Date(),
    },
    {
      id: "claim-2",
      amount: 150,
      procedureCodes: ["99214"],
      diagnosisCodes: ["E11"],
      createdAt: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getMedicalRecord as jest.Mock).mockResolvedValue(mockMedicalRecord)
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(mockRecentClaims)
  })

  it("detects unusually high claim amounts", async () => {
    const result = await checkClaimForFraud(
      mockPatientId,
      1000, // Much higher than average
      ["99213"],
      ["I10"]
    )

    expect(result.isFraudulent).toBe(true)
    expect(result.reasons).toContain("Unusually high claim amount")
    expect(result.riskScore).toBeGreaterThan(0)
  })

  it("detects high frequency of claims", async () => {
    const manyRecentClaims = Array(12).fill(mockRecentClaims[0])
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(manyRecentClaims)

    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["99213"],
      ["I10"]
    )

    expect(result.reasons).toContain("High frequency of claims")
    expect(result.riskScore).toBeGreaterThan(0)
  })

  it("detects duplicate procedures", async () => {
    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["99213"], // Already exists in recent claims
      ["I10"]
    )

    expect(result.reasons).toContain("Duplicate procedures within 90 days")
    expect(result.riskScore).toBeGreaterThan(0)
  })

  it("detects procedure and diagnosis code mismatch", async () => {
    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["99213"], // Office visit code
      ["M25.5"] // Joint pain code (mismatch)
    )

    expect(result.reasons).toContain("Procedure and diagnosis code mismatch")
    expect(result.riskScore).toBeGreaterThan(0)
  })

  it("detects procedures without related conditions", async () => {
    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["J1100"], // Joint injection
      ["M25.5"] // Joint pain
    )

    expect(result.reasons).toContain("Procedures without related conditions in medical record")
    expect(result.riskScore).toBeGreaterThan(0)
  })

  it("returns high risk score for multiple fraud indicators", async () => {
    const manyRecentClaims = Array(12).fill(mockRecentClaims[0])
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(manyRecentClaims)

    const result = await checkClaimForFraud(
      mockPatientId,
      1000,
      ["99213", "J1100"],
      ["M25.5"]
    )

    expect(result.isFraudulent).toBe(true)
    expect(result.reasons.length).toBeGreaterThan(1)
    expect(result.riskScore).toBeGreaterThanOrEqual(0.5)
  })

  it("handles missing medical record", async () => {
    ;(getMedicalRecord as jest.Mock).mockResolvedValue(null)

    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["99213"],
      ["I10"]
    )

    expect(result.isFraudulent).toBe(true)
    expect(result.reasons).toContain("No medical record found for patient")
    expect(result.riskScore).toBe(1)
  })

  it("accepts valid claims", async () => {
    const result = await checkClaimForFraud(
      mockPatientId,
      100,
      ["99213"], // Office visit for hypertension
      ["I10"] // Hypertension diagnosis
    )

    expect(result.isFraudulent).toBe(false)
    expect(result.reasons).toHaveLength(0)
    expect(result.riskScore).toBeLessThan(0.5)
  })
}) 