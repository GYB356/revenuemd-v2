import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AttachmentUploader } from "@/app/dashboard/medical-records/components/attachment-uploader"
import { useToast } from "@/components/ui/use-toast"
import { act } from "react-dom/test-utils"

// Mock dependencies
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe("AttachmentUploader", () => {
  const mockToast = jest.fn()
  const mockOnUploadComplete = jest.fn()

  const mockExistingAttachments = [
    {
      name: "existing.pdf",
      type: "application/pdf",
      url: "https://example.com/existing.pdf",
      uploadDate: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        attachment: {
          name: "test.pdf",
          type: "application/pdf",
          url: "https://example.com/test.pdf",
          uploadDate: new Date().toISOString(),
        },
      }),
    })
  })

  it("renders the dropzone and existing attachments", () => {
    render(
      <AttachmentUploader
        patientId="patient-1"
        existingAttachments={mockExistingAttachments}
      />
    )

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
    expect(screen.getByText("existing.pdf")).toBeInTheDocument()
  })

  it("handles file upload successfully", async () => {
    render(
      <AttachmentUploader
        patientId="patient-1"
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const input = screen.getByRole("button")

    await act(async () => {
      const dropEvent = createDropEvent([file])
      fireEvent.drop(input, dropEvent)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/medical-records/attachments",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success",
        description: "Files uploaded successfully",
      })
    )
    expect(mockOnUploadComplete).toHaveBeenCalled()
  })

  it("handles upload errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Upload failed" }),
    })

    render(
      <AttachmentUploader
        patientId="patient-1"
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const input = screen.getByRole("button")

    await act(async () => {
      const dropEvent = createDropEvent([file])
      fireEvent.drop(input, dropEvent)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Upload failed",
          variant: "destructive",
        })
      )
    })
  })

  it("handles file deletion", async () => {
    render(
      <AttachmentUploader
        patientId="patient-1"
        existingAttachments={mockExistingAttachments}
      />
    )

    const deleteButton = screen.getByRole("button", { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/medical-records/attachments",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({
            patientId: "patient-1",
            fileName: "existing.pdf",
          }),
        })
      )
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success",
        description: "File deleted successfully",
      })
    )
  })

  it("handles deletion errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Delete failed" }),
    })

    render(
      <AttachmentUploader
        patientId="patient-1"
        existingAttachments={mockExistingAttachments}
      />
    )

    const deleteButton = screen.getByRole("button", { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Delete failed",
          variant: "destructive",
        })
      )
    })
  })
})

// Helper function to create drop event
function createDropEvent(files: File[]) {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: "file",
        type: file.type,
        getAsFile: () => file,
      })),
      types: ["Files"],
    },
  }
} 