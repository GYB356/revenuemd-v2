import { NextRequest } from "next/server"
import { GET, POST } from "@/app/api/patients/route"
import { GET as getPatientById, PUT, DELETE } from "@/app/api/patients/[patientId]/route"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { createMocks } from 'node-mocks-http'
import { logActivity } from '@/lib/activity-logger'
import { getCachedData, setCachedData } from '@/lib/redis'

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/activity-logger")
jest.mock("@/lib/redis")

describe("Patients API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatient = {
    id: "patient-1",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    gender: "MALE",
    email: "john.doe@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    insuranceProvider: "Blue Cross",
    insuranceNumber: "INS123456",
    medicalRecordId: "record-1",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
  })

  describe("GET /api/patients", () => {
    beforeEach(() => {
      ;(prisma.patient.findMany as jest.Mock).mockResolvedValue([mockPatient])
      ;(prisma.patient.count as jest.Mock).mockResolvedValue(1)
    })

    it("returns patients list with pagination", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients?page=1&limit=10")
      )
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patients).toHaveLength(1)
      expect(data.total).toBe(1)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(1)
    })

    it("handles search query", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients?search=john")
      )
      await GET(req)

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: expect.objectContaining({ contains: "john" }) },
              { lastName: expect.objectContaining({ contains: "john" }) },
              { email: expect.objectContaining({ contains: "john" }) },
            ]),
          }),
        })
      )
    })

    it("applies filters correctly", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients?insuranceProvider=Blue Cross")
      )
      await GET(req)

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            insuranceProvider: "Blue Cross",
          }),
        })
      )
    })

    it("returns patients with pagination and caching", async () => {
      const mockPatients = [
        {
          id: '1',
          name: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          contactInfo: 'john@example.com',
          createdAt: new Date(),
          _count: { claims: 2 },
        },
      ]

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(getCachedData as jest.Mock).mockResolvedValueOnce(null)
      ;(prisma.patient.findMany as jest.Mock).mockResolvedValueOnce(mockPatients)
      ;(prisma.patient.count as jest.Mock).mockResolvedValueOnce(1)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
          search: 'John',
          gender: 'MALE',
        },
      })

      await require('@/app/api/patients/route').GET(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual({
        patients: mockPatients,
        pagination: {
          total: 1,
          pages: 1,
          currentPage: 1,
          perPage: 10,
        },
      })
      expect(setCachedData).toHaveBeenCalled()
    })

    it("returns cached data when available", async () => {
      const cachedData = {
        patients: [],
        pagination: { total: 0, pages: 0, currentPage: 1, perPage: 10 },
      }

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(getCachedData as jest.Mock).mockResolvedValueOnce(cachedData)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await require('@/app/api/patients/route').GET(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual(cachedData)
      expect(prisma.patient.findMany).not.toHaveBeenCalled()
    })

    it("handles invalid query parameters", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          gender: 'INVALID',
        },
      })

      await require('@/app/api/patients/route').GET(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid query parameters',
      })
    })
  })

  describe("POST /api/patients", () => {
    const mockPatientData = {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      email: "john.doe@example.com",
      phone: "+1234567890",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      insuranceProvider: "Blue Cross",
      insuranceNumber: "INS123456",
    }

    beforeEach(() => {
      ;(prisma.patient.create as jest.Mock).mockResolvedValue(mockPatient)
    })

    it("creates a new patient", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients", {
          method: "POST",
          body: JSON.stringify(mockPatientData),
        })
      )
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.patient).toEqual(mockPatient)
      expect(prisma.patient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mockPatientData,
          dateOfBirth: new Date(mockPatientData.dateOfBirth),
          userId: mockUser.id,
        }),
      })
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: 'CREATE_PATIENT',
        details: expect.any(String),
      })
    })

    it("validates required fields", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients", {
          method: "POST",
          body: JSON.stringify({}),
        })
      )
      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it("validates email format", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients", {
          method: "POST",
          body: JSON.stringify({
            ...mockPatientData,
            email: "invalid-email",
          }),
        })
      )
      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })

  describe("GET /api/patients/[patientId]", () => {
    beforeEach(() => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
    })

    it("returns patient details", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1")
      )
      const response = await getPatientById(req, { params: { patientId: "patient-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patient).toEqual(mockPatient)
    })

    it("returns 404 for non-existent patient", async () => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/patients/non-existent")
      )
      const response = await getPatientById(req, { params: { patientId: "non-existent" } })
      expect(response.status).toBe(404)
    })
  })

  describe("PUT /api/patients/[patientId]", () => {
    const mockUpdateData = {
      phone: "+1987654321",
      address: "456 New St",
    }

    beforeEach(() => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
      ;(prisma.patient.update as jest.Mock).mockResolvedValue({
        ...mockPatient,
        ...mockUpdateData,
      })
    })

    it("updates patient details", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "PUT",
          body: JSON.stringify(mockUpdateData),
        })
      )
      const response = await PUT(req, { params: { patientId: "patient-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patient.phone).toBe(mockUpdateData.phone)
      expect(data.patient.address).toBe(mockUpdateData.address)
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: 'UPDATE_PATIENT',
        details: expect.any(String),
      })
    })

    it("validates email format on update", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "PUT",
          body: JSON.stringify({ email: "invalid-email" }),
        })
      )
      const response = await PUT(req, { params: { patientId: "patient-1" } })
      expect(response.status).toBe(400)
    })

    it("prevents updating immutable fields", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "PUT",
          body: JSON.stringify({ id: "new-id" }),
        })
      )
      const response = await PUT(req, { params: { patientId: "patient-1" } })
      expect(response.status).toBe(400)
    })
  })

  describe("DELETE /api/patients/[patientId]", () => {
    beforeEach(() => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
      ;(prisma.patient.delete as jest.Mock).mockResolvedValue(mockPatient)
    })

    it("deletes a patient", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { patientId: "patient-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: 'DELETE_PATIENT',
        details: expect.any(String),
      })
    })

    it("requires admin role", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: "USER",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { patientId: "patient-1" } })
      expect(response.status).toBe(403)
    })

    it("returns 404 for non-existent patient", async () => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/patients/non-existent", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { patientId: "non-existent" } })
      expect(response.status).toBe(404)
    })

    it("prevents deletion if patient has active claims", async () => {
      ;(prisma.claim.findFirst as jest.Mock).mockResolvedValue({
        id: "claim-1",
        status: "PENDING",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/patients/patient-1", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { patientId: "patient-1" } })
      expect(response.status).toBe(400)
    })
  })
}) 