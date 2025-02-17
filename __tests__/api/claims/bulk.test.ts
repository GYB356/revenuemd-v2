import { NextRequest } from "next/server"
import { PUT } from "@/app/api/claims/bulk/route"
import { prisma } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/activity-logger")

describe("Bulk Claims API", () => {
  const mockUser = {
    id: "user-1",
    email: "admin@example.com",
    role: "ADMIN",
  }

  const mockClaims = [
    {
      id: "claim-1",
      status: "PENDING",
    },
    {
      id: "claim-2",
      status: "PENDING",
    },
    {
      id: "claim-3",
      status: "APPROVED",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims)
    ;(prisma.claim.updateMany as jest.Mock).mockResolvedValue({ count: 2 })
  })

  describe("PUT /api/claims/bulk", () => {
    it("performs bulk status update", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/bulk", {
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-2"],
            status: "APPROVED",
            notes: "Bulk approval",
          }),
        })
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.updatedCount).toBe(2)
      expect(prisma.claim.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: ["claim-1", "claim-2"] },
            status: "PENDING",
          },
          data: expect.objectContaining({
            status: "APPROVED",
          }),
        })
      )
      expect(logActivity).toHaveBeenCalled()
    })

    it("validates status transitions", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/bulk", {
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-3"],
            status: "PENDING",
          }),
        })
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid status transitions")
      expect(data.details).toContain("claim-3")
    })

    it("requires admin role", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: "USER",
      })

      const req = new NextRequest(
        new Request("http://localhost/api/claims/bulk", {
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-2"],
            status: "APPROVED",
          }),
        })
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Only administrators can perform bulk updates")
    })

    it("validates request body", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/claims/bulk", {
          method: "PUT",
          body: JSON.stringify({
            claimIds: [], // Empty array
            status: "INVALID_STATUS",
          }),
        })
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Validation error")
    })

    it("handles database errors", async () => {
      ;(prisma.claim.updateMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      )

      const req = new NextRequest(
        new Request("http://localhost/api/claims/bulk", {
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-2"],
            status: "APPROVED",
          }),
        })
      )

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to perform bulk update")
    })
  })
}) 