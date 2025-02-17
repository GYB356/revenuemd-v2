import { NextRequest } from "next/server"
import { POST as loginHandler } from "@/app/api/auth/login/route"
import { POST as refreshHandler } from "@/app/api/auth/refresh/route"
import { POST as requestResetHandler, PUT as resetHandler } from "@/app/api/auth/reset-password/route"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendEmail } from "@/lib/email"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("@/lib/email")

describe("Authentication API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    password: "hashed_password",
    role: "ADMIN",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Login Endpoint", () => {
    beforeEach(() => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue("mock_token")
    })

    it("returns 400 for invalid credentials", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: "invalid" }),
        })
      )
      const response = await loginHandler(req)
      expect(response.status).toBe(400)
    })

    it("returns 401 for non-existent user", async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password123",
          }),
        })
      )
      const response = await loginHandler(req)
      expect(response.status).toBe(401)
    })

    it("returns 401 for incorrect password", async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const req = new NextRequest(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "wrong_password",
          }),
        })
      )
      const response = await loginHandler(req)
      expect(response.status).toBe(401)
    })

    it("returns tokens for successful login", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "correct_password",
          }),
        })
      )
      const response = await loginHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("accessToken")
      expect(data).toHaveProperty("refreshToken")
    })
  })

  describe("Refresh Token Endpoint", () => {
    const mockStoredToken = {
      id: "token-1",
      token: "valid_refresh_token",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      user: mockUser,
    }

    beforeEach(() => {
      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken)
      ;(jwt.sign as jest.Mock).mockReturnValue("new_token")
    })

    it("returns 400 for missing refresh token", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({}),
        })
      )
      const response = await refreshHandler(req)
      expect(response.status).toBe(400)
    })

    it("returns 401 for invalid refresh token", async () => {
      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request("http://localhost/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: "invalid_token" }),
        })
      )
      const response = await refreshHandler(req)
      expect(response.status).toBe(401)
    })

    it("returns 401 for expired refresh token", async () => {
      ;(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000),
      })

      const req = new NextRequest(
        new Request("http://localhost/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: "expired_token" }),
        })
      )
      const response = await refreshHandler(req)
      expect(response.status).toBe(401)
    })

    it("returns new tokens for valid refresh token", async () => {
      const req = new NextRequest(
        new Request("http://localhost/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: "valid_refresh_token" }),
        })
      )
      const response = await refreshHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("accessToken")
      expect(data).toHaveProperty("refreshToken")
    })
  })

  describe("Password Reset Endpoints", () => {
    beforeEach(() => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(jwt.sign as jest.Mock).mockReturnValue("reset_token")
      ;(bcrypt.hash as jest.Mock).mockResolvedValue("hashed_token")
      ;(sendEmail as jest.Mock).mockResolvedValue(true)
    })

    describe("Request Reset", () => {
      it("returns success even for non-existent email", async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const req = new NextRequest(
          new Request("http://localhost/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email: "nonexistent@example.com" }),
          })
        )
        const response = await requestResetHandler(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toContain("If an account exists")
      })

      it("generates reset token and sends email for valid user", async () => {
        const req = new NextRequest(
          new Request("http://localhost/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email: "test@example.com" }),
          })
        )
        const response = await requestResetHandler(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(prisma.user.update).toHaveBeenCalled()
        expect(sendEmail).toHaveBeenCalled()
      })
    })

    describe("Reset Password", () => {
      beforeEach(() => {
        ;(jwt.verify as jest.Mock).mockReturnValue({ userId: "user-1" })
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      })

      it("returns 400 for invalid token", async () => {
        ;(jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error("Invalid token")
        })

        const req = new NextRequest(
          new Request("http://localhost/api/auth/reset-password", {
            method: "PUT",
            body: JSON.stringify({
              token: "invalid_token",
              password: "NewPassword123!",
            }),
          })
        )
        const response = await resetHandler(req)
        expect(response.status).toBe(400)
      })

      it("returns 400 for expired reset token", async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
          ...mockUser,
          resetTokenExpires: new Date(Date.now() - 1000),
        })

        const req = new NextRequest(
          new Request("http://localhost/api/auth/reset-password", {
            method: "PUT",
            body: JSON.stringify({
              token: "expired_token",
              password: "NewPassword123!",
            }),
          })
        )
        const response = await resetHandler(req)
        expect(response.status).toBe(400)
      })

      it("successfully resets password with valid token", async () => {
        const req = new NextRequest(
          new Request("http://localhost/api/auth/reset-password", {
            method: "PUT",
            body: JSON.stringify({
              token: "valid_token",
              password: "NewPassword123!",
            }),
          })
        )
        const response = await resetHandler(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe("Password has been reset successfully")
        expect(prisma.user.update).toHaveBeenCalled()
      })
    })
  })
}) 