import { NextRequest } from "next/server"
import { POST } from "@/app/api/upload/route"
import { verifyAuth } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"

// Mock dependencies
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
}))

jest.mock("path", () => ({
  join: jest.fn(() => "/mock/path/to/file"),
}))

jest.mock("@/lib/auth", () => ({
  verifyAuth: jest.fn(),
}))

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}))

describe("Upload API", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(writeFile as jest.Mock).mockResolvedValue(undefined)
  })

  it("returns 401 if user is not authenticated", async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue(null)

    const formData = new FormData()
    formData.append("file", new Blob(["test"]), "test.pdf")

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 400 if no file is provided", async () => {
    const formData = new FormData()

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("No file provided")
  })

  it("returns 400 if file size exceeds limit", async () => {
    const largeFile = new Blob([new ArrayBuffer(6 * 1024 * 1024)]) // 6MB
    const formData = new FormData()
    formData.append("file", largeFile, "large.pdf")

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("File size exceeds 5MB limit")
  })

  it("returns 400 if file type is not allowed", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new Blob(["test"], { type: "application/zip" }),
      "test.zip"
    )

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid file type. Only PDF, JPG, and PNG files are allowed")
  })

  it("successfully uploads a file", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new Blob(["test"], { type: "application/pdf" }),
      "test.pdf"
    )

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      url: "/uploads/mock-uuid.pdf",
      name: "test.pdf",
      type: "application/pdf",
      size: 4,
    })
    expect(writeFile).toHaveBeenCalled()
    expect(join).toHaveBeenCalledWith(expect.any(String), "public", "uploads")
  })

  it("handles file write errors", async () => {
    ;(writeFile as jest.Mock).mockRejectedValue(new Error("Write error"))

    const formData = new FormData()
    formData.append(
      "file",
      new Blob(["test"], { type: "application/pdf" }),
      "test.pdf"
    )

    const req = new NextRequest(
      new Request("http://localhost/api/upload", {
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