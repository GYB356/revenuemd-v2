import { AttachmentService } from "@/lib/services/AttachmentService"
import { prisma } from "@/lib/db"
import { supabase } from "@/lib/supabase"
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
      rejects: {
        toThrow(message?: string | Error): Promise<R>
      }
    }
  }
}

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  },
}))

describe("AttachmentService", () => {
  const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" })
  const mockUser = "user-1"
  const mockEntityId = "claim-1"
  const mockAttachment = {
    id: "attachment-1",
    name: "test.pdf",
    url: "https://example.com/test.pdf",
    type: "application/pdf",
    size: 1024,
    entityType: "CLAIM",
    entityId: mockEntityId,
    uploadedBy: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.attachment.create as jest.Mock).mockResolvedValue(mockAttachment)
    ;(prisma.attachment.findUnique as jest.Mock).mockResolvedValue(mockAttachment)
    ;(prisma.attachment.findMany as jest.Mock).mockResolvedValue([mockAttachment])
    ;(prisma.attachment.delete as jest.Mock).mockResolvedValue(mockAttachment)

    const mockStorage = supabase.storage.from("")
    ;(mockStorage.upload as jest.Mock).mockResolvedValue({ data: { path: "test.pdf" }, error: null })
    ;(mockStorage.remove as jest.Mock).mockResolvedValue({ error: null })
    ;(mockStorage.getPublicUrl as jest.Mock).mockReturnValue({ data: { publicUrl: "https://example.com/test.pdf" } })
  })

  describe("upload", () => {
    it("uploads a file and creates an attachment record", async () => {
      const result = await AttachmentService.upload({
        file: mockFile,
        entityType: "CLAIM",
        entityId: mockEntityId,
        uploadedBy: mockUser,
      })

      expect(result).toEqual(mockAttachment)
      expect(supabase.storage.from).toHaveBeenCalledWith("attachments")
      expect(prisma.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockFile.name,
          type: mockFile.type,
          entityType: "CLAIM",
          entityId: mockEntityId,
          uploadedBy: mockUser,
        }),
      })
    })

    it("handles upload errors", async () => {
      const mockStorage = supabase.storage.from("")
      ;(mockStorage.upload as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("Upload failed"),
      })

      await expect(
        AttachmentService.upload({
          file: mockFile,
          entityType: "CLAIM",
          entityId: mockEntityId,
          uploadedBy: mockUser,
        })
      ).rejects.toThrow("Failed to upload file")
    })
  })

  describe("delete", () => {
    it("deletes an attachment and its file", async () => {
      await AttachmentService.delete({
        id: mockAttachment.id,
        uploadedBy: mockUser,
      })

      expect(supabase.storage.from).toHaveBeenCalledWith("attachments")
      expect(prisma.attachment.delete).toHaveBeenCalledWith({
        where: { id: mockAttachment.id },
      })
    })

    it("throws error if attachment not found", async () => {
      ;(prisma.attachment.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        AttachmentService.delete({
          id: "non-existent",
          uploadedBy: mockUser,
        })
      ).rejects.toThrow("Attachment not found")
    })

    it("throws error if user unauthorized", async () => {
      await expect(
        AttachmentService.delete({
          id: mockAttachment.id,
          uploadedBy: "different-user",
        })
      ).rejects.toThrow("Unauthorized to delete this attachment")
    })

    it("handles delete errors", async () => {
      const mockStorage = supabase.storage.from("")
      ;(mockStorage.remove as jest.Mock).mockResolvedValue({
        error: new Error("Delete failed"),
      })

      await expect(
        AttachmentService.delete({
          id: mockAttachment.id,
          uploadedBy: mockUser,
        })
      ).rejects.toThrow("Failed to delete file")
    })
  })

  describe("getAttachments", () => {
    it("retrieves attachments for an entity", async () => {
      const result = await AttachmentService.getAttachments("CLAIM", mockEntityId)

      expect(result).toEqual([mockAttachment])
      expect(prisma.attachment.findMany).toHaveBeenCalledWith({
        where: {
          entityType: "CLAIM",
          entityId: mockEntityId,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    })
  })
}) 