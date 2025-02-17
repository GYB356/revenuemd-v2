import { NextRequest } from "next/server"
import { GET, POST, PUT, DELETE } from "@/app/api/claims/route"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { AttachmentService } from "@/lib/services/AttachmentService"
import { checkClaimForFraud } from "@/lib/claims/fraud-detection"
import { logActivity } from "@/lib/activity-logger"
import { getCachedData, setCachedData } from "@/lib/redis"
import "@testing-library/jest-dom"
import "@testing-library/jest-dom/extend-expect"

// Add Jest matchers type declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveLength(length: number): R
      toBe(expected: any): R
      toEqual(expected: any): R
      toHaveBeenCalled(): R
      toHaveBeenCalledWith(...args: any[]): R
      toHaveBeenCalledTimes(count: number): R
    }
  }
}

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/services/AttachmentService")
jest.mock("@/lib/claims/fraud-detection")
jest.mock("@/lib/activity-logger")
jest.mock("@/lib/redis")

describe("Claims API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatient = {
    id: "patient-1",
    name: "John Doe",
    contactInfo: { phone: "123-456-7890", email: "john@example.com" },
  }

  const mockClaim = {
    id: "claim-1",
    amount: 100,
    status: "PENDING",
    procedureCodes: ["99213"],
    diagnosisCodes: ["I10"],
    notes: "Test claim",
    isFraudulent: false,
    patientId: "patient-1",
    createdBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    creator: mockUser,
  }

  const mockAttachment = {
    id: "attachment-1",
    name: "test.pdf",
    url: "https://example.com/test.pdf",
    type: "application/pdf",
    size: 1024,
    entityType: "CLAIM",
    entityId: "claim-1",
    uploadedBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
    ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue([mockClaim])
    ;(prisma.claim.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim)
    ;(prisma.claim.update as jest.Mock).mockResolvedValue(mockClaim)
    ;(prisma.claim.delete as jest.Mock).mockResolvedValue(mockClaim)
    ;(AttachmentService.upload as jest.Mock).mockResolvedValue(mockAttachment)
    ;(AttachmentService.getAttachments as jest.Mock).mockResolvedValue([mockAttachment])
    ;(checkClaimForFraud as jest.Mock).mockResolvedValue({ isFraudulent: false, reasons: [], riskScore: 0 })
    ;(getCachedData as jest.Mock).mockResolvedValue(null)
  })

  describe("GET /api/claims", () => {
    it("returns claims with attachments", async () => {
      const req = new NextRequest(new URL("http://localhost/api/claims"))
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claims).toHaveLength(1)
      expect(data.claims[0].attachments).toHaveLength(1)
      expect(data.claims[0].attachments[0]).toEqual(mockAttachment)
      expect(AttachmentService.getAttachments).toHaveBeenCalledWith("CLAIM", mockClaim.id)
    })

    it("uses cached data when available", async () => {
      const cachedData = {
        claims: [{ ...mockClaim, attachments: [mockAttachment] }],
        pagination: { total: 1, pages: 1, currentPage: 1, perPage: 10 },
      }
      ;(getCachedData as jest.Mock).mockResolvedValueOnce(cachedData)

      const req = new NextRequest(new URL("http://localhost/api/claims"))
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(cachedData)
      expect(prisma.claim.findMany).not.toHaveBeenCalled()
    })
  })

  describe("POST /api/claims", () => {
    it("creates a claim with attachments", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      formData.append("notes", "Test claim")
      
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      formData.append("files", file)

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.attachments).toHaveLength(1)
      expect(data.attachments[0]).toEqual(mockAttachment)
      expect(AttachmentService.upload).toHaveBeenCalledWith({
        file,
        entityType: "CLAIM",
        entityId: mockClaim.id,
        uploadedBy: mockUser.id,
      })
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "CREATE_CLAIM",
          metadata: expect.objectContaining({
            attachmentCount: 1,
          }),
        })
      )
    })

    it("handles missing required fields", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      // Missing amount and other required fields

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    it("handles file upload errors", async () => {
      ;(AttachmentService.upload as jest.Mock).mockRejectedValueOnce(
        new Error("Upload failed")
      )

      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      formData.append("files", file)

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to create claim")
    })
  })

  describe("PUT /api/claims", () => {
    it("updates a claim", async () => {
      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        {
          method: "PUT",
          body: JSON.stringify({
            id: "claim-1",
            status: "APPROVED",
            notes: "Updated notes",
          }),
        }
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe("APPROVED")
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "UPDATE_CLAIM",
          metadata: expect.objectContaining({
            changes: ["status", "notes"],
          }),
        })
      )
    })
  })

  describe("DELETE /api/claims", () => {
    it("deletes a claim and its attachments", async () => {
      // Mock that the claim has attachments
      ;(AttachmentService.getAttachments as jest.Mock).mockResolvedValueOnce([
        mockAttachment,
        { ...mockAttachment, id: "attachment-2" },
      ])

      const req = new NextRequest(
        new URL("http://localhost/api/claims?id=claim-1")
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(AttachmentService.delete).toHaveBeenCalledTimes(2)
      expect(AttachmentService.delete).toHaveBeenCalledWith({
        id: mockAttachment.id,
        uploadedBy: mockUser.id,
      })
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DELETE_CLAIM",
          metadata: expect.objectContaining({
            claimId: "claim-1",
            attachmentsDeleted: 2,
          }),
        })
      )
    })

    it("handles attachment deletion errors during claim deletion", async () => {
      ;(AttachmentService.getAttachments as jest.Mock).mockResolvedValueOnce([mockAttachment])
      ;(AttachmentService.delete as jest.Mock).mockRejectedValueOnce(new Error("Failed to delete attachment"))

      const req = new NextRequest(
        new URL("http://localhost/api/claims?id=claim-1")
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to delete claim")
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DELETE_CLAIM",
          metadata: expect.objectContaining({
            error: "Failed to delete attachment",
          }),
        })
      )
    })
  })

  describe("POST /api/claims with file validation", () => {
    it("validates file types", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      
      const invalidFile = new File(["test"], "test.exe", { type: "application/x-msdownload" })
      formData.append("files", invalidFile)

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid file type")
    })

    it("validates file size", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      
      // Create a large file (11MB)
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "large.pdf", { type: "application/pdf" })
      formData.append("files", largeFile)

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("File size exceeds limit")
    })

    it("validates total number of files", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      
      // Add 6 files (exceeding limit of 5)
      for (let i = 0; i < 6; i++) {
        const file = new File(["test"], `test${i}.pdf`, { type: "application/pdf" })
        formData.append("files", file)
      }

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Too many files")
    })

    it("validates duplicate file names", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      formData.append("amount", "100")
      formData.append("procedureCodes", JSON.stringify(["99213"]))
      formData.append("diagnosisCodes", JSON.stringify(["I10"]))
      
      // Add two files with the same name
      const file1 = new File(["test1"], "test.pdf", { type: "application/pdf" })
      const file2 = new File(["test2"], "test.pdf", { type: "application/pdf" })
      formData.append("files", file1)
      formData.append("files", file2)

      const req = new NextRequest(
        new URL("http://localhost/api/claims"),
        { method: "POST", body: formData }
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Duplicate file names not allowed")
    })
  })
}) 