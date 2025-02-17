import { NextRequest } from "next/server"
import { GET, POST } from "@/app/api/claims/route"
import { GET as getClaimById, PUT, DELETE } from "@/app/api/claims/[claimId]/route"
import { PUT as updateClaimStatus } from "@/app/api/claims/[claimId]/status/route"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { createMocks } from 'node-mocks-http'
import { logActivity } from '@/lib/activity-logger'

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/activity-logger")

describe("Claims API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockClaim = {
    id: "claim-1",
    patientId: "patient-1",
    amount: 1000.00,
    status: "PENDING",
    description: "Medical procedure",
    submittedAt: new Date(),
    updatedAt: new Date(),
    documents: [],
    userId: "user-1",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
  })

  describe("GET /api/claims", () => {
    beforeEach(() => {
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue([mockClaim])
      ;(prisma.claim.count as jest.Mock).mockResolvedValue(1)
    })

    it("returns claims list with pagination", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims?page=1&limit=10")
      )
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claims).toHaveLength(1)
      expect(data.total).toBe(1)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(1)
    })

    it("applies filters correctly", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims?status=PENDING&minAmount=500")
      )
      await GET(req)

      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            amount: { gte: 500 },
          }),
        })
      )
    })

    it("handles search query", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims?search=procedure")
      )
      await GET(req)

      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { description: expect.objectContaining({ contains: "procedure" }) },
            ]),
          }),
        })
      )
    })

    it("returns claims with pagination", async () => {
      const mockClaims = [
        {
          id: '1',
          patientId: '1',
          amount: 100,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          patient: {
            name: 'John Doe',
            contactInfo: 'john@example.com',
          },
        },
      ]

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValueOnce(mockClaims)
      ;(prisma.claim.count as jest.Mock).mockResolvedValueOnce(1)

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '1',
          limit: '10',
        },
      })

      await require('@/app/api/claims/route').GET(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual({
        claims: mockClaims,
        pagination: {
          total: 1,
          pages: 1,
          currentPage: 1,
          perPage: 10,
        },
      })
    })

    it("handles unauthorized access", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await require('@/app/api/claims/route').GET(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Unauthorized',
      })
    })
  })

  describe("POST /api/claims", () => {
    const mockClaimData = {
      patientId: "patient-1",
      amount: 1000.00,
      description: "Medical procedure",
      documents: [],
    }

    beforeEach(() => {
      ;(prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim)
    })

    it("creates a new claim", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims", {
          method: "POST",
          body: JSON.stringify(mockClaimData),
        })
      )
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.claim).toEqual(mockClaim)
      expect(prisma.claim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mockClaimData,
          userId: mockUser.id,
          status: "PENDING",
        }),
      })
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: 'CREATE_CLAIM',
        details: expect.any(String),
      })
    })

    it("validates required fields", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims", {
          method: "POST",
          body: JSON.stringify({}),
        })
      )
      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it("creates a new claim", async () => {
      const mockClaim = {
        id: '1',
        patientId: '1',
        amount: 100,
        status: 'PENDING',
      }

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.claim.create as jest.Mock).mockResolvedValueOnce(mockClaim)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          patientId: '1',
          amount: 100,
        },
      })

      await require('@/app/api/claims/route').POST(req, res)

      expect(res._getStatusCode()).toBe(201)
      expect(JSON.parse(res._getData())).toEqual(mockClaim)
      expect(logActivity).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'CREATE_CLAIM',
        details: expect.any(String),
      })
    })

    it("validates required fields", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
        },
      })

      await require('@/app/api/claims/route').POST(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Validation error',
        details: expect.any(Array),
      })
    })
  })

  describe("GET /api/claims/[claimId]", () => {
    beforeEach(() => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
    })

    it("returns claim details", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1")
      )
      const response = await getClaimById(req, { params: { claimId: "claim-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claim).toEqual(mockClaim)
    })

    it("returns 404 for non-existent claim", async () => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/claims/non-existent")
      )
      const response = await getClaimById(req, { params: { claimId: "non-existent" } })
      expect(response.status).toBe(404)
    })
  })

  describe("PUT /api/claims/[claimId]", () => {
    const mockUpdateData = {
      amount: 1500.00,
      description: "Updated procedure",
    }

    beforeEach(() => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        ...mockUpdateData,
      })
    })

    it("updates claim details", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1", {
          method: "PUT",
          body: JSON.stringify(mockUpdateData),
        })
      )
      const response = await PUT(req, { params: { claimId: "claim-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claim.amount).toBe(1500.00)
      expect(data.claim.description).toBe("Updated procedure")
    })

    it("prevents updating immutable fields", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1", {
          method: "PUT",
          body: JSON.stringify({ status: "APPROVED" }),
        })
      )
      const response = await PUT(req, { params: { claimId: "claim-1" } })
      expect(response.status).toBe(400)
    })
  })

  describe("PUT /api/claims/[claimId]/status", () => {
    beforeEach(() => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        status: "APPROVED",
      })
    })

    it("updates claim status", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1/status", {
          method: "PUT",
          body: JSON.stringify({ status: "APPROVED" }),
        })
      )
      const response = await updateClaimStatus(req, { params: { claimId: "claim-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.claim.status).toBe("APPROVED")
    })

    it("validates status transitions", async () => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        ...mockClaim,
        status: "APPROVED",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1/status", {
          method: "PUT",
          body: JSON.stringify({ status: "PENDING" }),
        })
      )
      const response = await updateClaimStatus(req, { params: { claimId: "claim-1" } })
      expect(response.status).toBe(400)
    })

    it("requires admin role for certain status changes", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: "USER",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1/status", {
          method: "PUT",
          body: JSON.stringify({ status: "APPROVED" }),
        })
      )
      const response = await updateClaimStatus(req, { params: { claimId: "claim-1" } })
      expect(response.status).toBe(403)
    })
  })

  describe("DELETE /api/claims/[claimId]", () => {
    beforeEach(() => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.delete as jest.Mock).mockResolvedValue(mockClaim)
    })

    it("deletes a claim", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { claimId: "claim-1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("requires admin role", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: "USER",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/claims/claim-1", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { claimId: "claim-1" } })
      expect(response.status).toBe(403)
    })

    it("returns 404 for non-existent claim", async () => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/claims/non-existent", {
          method: "DELETE",
        })
      )
      const response = await DELETE(req, { params: { claimId: "non-existent" } })
      expect(response.status).toBe(404)
    })

    it("deletes a claim", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.claim.delete as jest.Mock).mockResolvedValueOnce({ id: '1' })

      const { req, res } = createMocks({
        method: 'DELETE',
        body: {
          id: '1',
        },
      })

      await require('@/app/api/claims/route').DELETE(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(logActivity).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'DELETE_CLAIM',
        details: expect.any(String),
      })
    })

    it("handles non-existent claim", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.claim.delete as jest.Mock).mockRejectedValueOnce(new Error('Not found'))

      const { req, res } = createMocks({
        method: 'DELETE',
        body: {
          id: 'non-existent',
        },
      })

      await require('@/app/api/claims/route').DELETE(req, res)

      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Claim not found',
      })
    })
  })
}) 