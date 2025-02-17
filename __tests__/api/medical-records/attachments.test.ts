import { NextRequest } from "next/server"
import { POST, DELETE } from "@/app/api/medical-records/attachments/route"
import { prisma } from "@/lib/db"
import { getMedicalRecord, updateMedicalRecord } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activity-logger"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/mongodb")
jest.mock("@/lib/auth")
jest.mock("@/lib/supabase")
jest.mock("@/lib/activity-logger")

describe("Medical Records Attachments API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatient = {
    id: "patient-1",
    name: "John Doe",
    medicalRecordId: "record-1",
  }

  const mockMedicalRecord = {
    _id: "record-1",
    patientId: "patient-1",
    attachments: [
      {
        name: "test.pdf",
        type: "application/pdf",
        url: "https://example.com/test.pdf",
        uploadDate: new Date(),
      },
    ],
  }

  const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)
    ;(getMedicalRecord as jest.Mock).mockResolvedValue(mockMedicalRecord)
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: "test.pdf" }, error: null }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.pdf" } }),
    })
  })

  describe("POST /api/medical-records/attachments", () => {
    it("should upload a new attachment", async () => {
      const formData = new FormData()
      formData.append("file", mockFile)
      formData.append("patientId", "patient-1")

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "POST",
          body: formData,
        })
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.attachment).toHaveProperty("name", "test.pdf")
      expect(updateMedicalRecord).toHaveBeenCalled()
      expect(logActivity).toHaveBeenCalled()
    })

    it("should return 400 if file or patientId is missing", async () => {
      const formData = new FormData()
      formData.append("patientId", "patient-1")
      // Missing file

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "POST",
          body: formData,
        })
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("File and patient ID are required")
    })

    it("should return 404 if patient is not found", async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      formData.append("file", mockFile)
      formData.append("patientId", "patient-1")

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "POST",
          body: formData,
        })
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Patient not found")
    })

    it("should handle upload errors", async () => {
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: new Error("Upload failed") }),
      })

      const formData = new FormData()
      formData.append("file", mockFile)
      formData.append("patientId", "patient-1")

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "POST",
          body: formData,
        })
      )

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to upload file")
    })
  })

  describe("DELETE /api/medical-records/attachments", () => {
    it("should delete an attachment", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "DELETE",
          body: JSON.stringify({
            patientId: "patient-1",
            fileName: "test.pdf",
          }),
        })
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateMedicalRecord).toHaveBeenCalled()
      expect(logActivity).toHaveBeenCalled()
    })

    it("should return 400 if patientId or fileName is missing", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "DELETE",
          body: JSON.stringify({
            patientId: "patient-1",
            // Missing fileName
          }),
        })
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Patient ID and file name are required")
    })

    it("should return 404 if patient is not found", async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "DELETE",
          body: JSON.stringify({
            patientId: "patient-1",
            fileName: "test.pdf",
          }),
        })
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Patient not found")
    })

    it("should handle delete errors", async () => {
      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: new Error("Delete failed") }),
      })

      const req = new NextRequest(
        new Request("http://localhost/api/medical-records/attachments", {
          method: "DELETE",
          body: JSON.stringify({
            patientId: "patient-1",
            fileName: "test.pdf",
          }),
        })
      )

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to delete file")
    })
  })
}) 