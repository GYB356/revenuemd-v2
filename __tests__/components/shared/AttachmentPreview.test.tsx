import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AttachmentPreview } from "@/components/shared/AttachmentPreview"

describe("AttachmentPreview", () => {
  const mockAttachments = [
    {
      id: "att-1",
      name: "test.pdf",
      type: "application/pdf",
      size: 1024,
      url: "https://example.com/test.pdf",
      createdAt: "2024-01-01T00:00:00Z",
      uploadedBy: {
        id: "user-1",
        name: "John Doe",
      },
    },
    {
      id: "att-2",
      name: "image.jpg",
      type: "image/jpeg",
      size: 2048,
      url: "https://example.com/image.jpg",
      createdAt: "2024-01-02T00:00:00Z",
      uploadedBy: {
        id: "user-2",
        name: "Jane Smith",
      },
    },
  ]

  it("renders empty state when no attachments", () => {
    render(<AttachmentPreview attachments={[]} />)
    expect(screen.getByText(/no attachments available/i)).toBeInTheDocument()
  })

  it("renders attachment list correctly", () => {
    render(<AttachmentPreview attachments={mockAttachments} />)

    // Check file names are rendered as links
    expect(screen.getByText("test.pdf")).toBeInTheDocument()
    expect(screen.getByText("image.jpg")).toBeInTheDocument()

    // Check file sizes are formatted
    expect(screen.getByText("1.0 KB")).toBeInTheDocument()
    expect(screen.getByText("2.0 KB")).toBeInTheDocument()

    // Check upload dates are formatted
    expect(screen.getByText(/uploaded jan 1, 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/uploaded jan 2, 2024/i)).toBeInTheDocument()

    // Check uploader names are shown
    expect(screen.getByText(/by john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/by jane smith/i)).toBeInTheDocument()
  })

  it("renders file links with correct attributes", () => {
    render(<AttachmentPreview attachments={mockAttachments} />)

    const fileLinks = screen.getAllByRole("link")
    expect(fileLinks[0]).toHaveAttribute("href", "https://example.com/test.pdf")
    expect(fileLinks[0]).toHaveAttribute("target", "_blank")
    expect(fileLinks[0]).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("handles attachment deletion", async () => {
    const mockOnDelete = jest.fn().mockResolvedValue(undefined)
    render(<AttachmentPreview attachments={mockAttachments} onDelete={mockOnDelete} />)

    // Find and click delete button
    const deleteButtons = screen.getAllByLabelText(/delete attachment/i)
    fireEvent.click(deleteButtons[0])

    // Check loading state
    expect(screen.getByRole("status")).toBeInTheDocument()

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith("att-1")
    })
  })

  it("handles deletion errors", async () => {
    const mockError = new Error("Failed to delete")
    const mockOnDelete = jest.fn().mockRejectedValue(mockError)
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    render(<AttachmentPreview attachments={mockAttachments} onDelete={mockOnDelete} />)

    // Find and click delete button
    const deleteButtons = screen.getAllByLabelText(/delete attachment/i)
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to delete attachment:",
        mockError
      )
    })

    consoleSpy.mockRestore()
  })

  it("does not show delete buttons when onDelete is not provided", () => {
    render(<AttachmentPreview attachments={mockAttachments} />)
    expect(screen.queryByLabelText(/delete attachment/i)).not.toBeInTheDocument()
  })

  it("disables delete button during deletion", async () => {
    const mockOnDelete = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<AttachmentPreview attachments={mockAttachments} onDelete={mockOnDelete} />)

    // Find and click delete button
    const deleteButton = screen.getAllByLabelText(/delete attachment/i)[0]
    fireEvent.click(deleteButton)

    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveClass("opacity-50", "cursor-not-allowed")

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled()
    })
  })
}) 