import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ClaimsTable } from "@/app/dashboard/claims/components/claims-table"
import { useToast } from "@/components/ui/use-toast"
import "@testing-library/jest-dom"
import "@testing-library/jest-dom/extend-expect"
import { expect, jest, describe, it, beforeEach } from "@jest/globals"

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveLength(length: number): R
    }
  }
}

// Mock dependencies
jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(),
}))

// Mock fetch
const mockFetchResponse = new Response(
  JSON.stringify({ success: true, updatedCount: 2 }),
  { status: 200 }
)

const mockFetch = jest.fn(() => Promise.resolve(mockFetchResponse))
global.fetch = mockFetch as unknown as typeof fetch

describe("ClaimsTable", () => {
  const mockClaims = [
    {
      id: "claim-1",
      amount: 100,
      status: "PENDING",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "claim-2",
      amount: 200,
      status: "PENDING",
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
  ]

  const mockToast = jest.fn()
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
    mockFetch.mockResolvedValue(mockFetchResponse)
  })

  it("renders claims table with data", () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    expect(screen.getByText("$100.00")).toBeInTheDocument()
    expect(screen.getByText("$200.00")).toBeInTheDocument()
    expect(screen.getAllByText("PENDING")).toHaveLength(2)
  })

  it("handles claim selection", () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1]) // First claim checkbox

    expect(screen.getByText("Approve Selected (1)")).toBeInTheDocument()
    expect(screen.getByText("Deny Selected (1)")).toBeInTheDocument()
  })

  it("handles bulk approval", async () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    // Select claims
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[2])

    // Click approve button
    const approveButton = screen.getByText("Approve Selected (2)")
    fireEvent.click(approveButton)

    // Add notes
    const notesInput = screen.getByPlaceholderText(/add any notes/i)
    fireEvent.change(notesInput, { target: { value: "Bulk approval notes" } })

    // Submit update
    const updateButton = screen.getByText("Update Claims")
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/claims/bulk",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-2"],
            status: "APPROVED",
            notes: "Bulk approval notes",
          }),
        })
      )
    })

    expect(mockOnRefresh).toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Success",
        description: "2 claims updated successfully",
      })
    )
  })

  it("handles bulk denial", async () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    // Select claims
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[2])

    // Click deny button
    const denyButton = screen.getByText("Deny Selected (2)")
    fireEvent.click(denyButton)

    // Submit update
    const updateButton = screen.getByText("Update Claims")
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/claims/bulk",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            claimIds: ["claim-1", "claim-2"],
            status: "DENIED",
          }),
        })
      )
    })
  })

  it("handles update errors", async () => {
    const errorResponse = {
      ok: false,
      json: () => Promise.resolve({ error: "Update failed" }),
    } as Response

    mockFetch.mockResolvedValue(errorResponse)

    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    // Select and try to update claims
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    const approveButton = screen.getByText("Approve Selected (1)")
    fireEvent.click(approveButton)
    const updateButton = screen.getByText("Update Claims")
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Update failed",
          variant: "destructive",
        })
      )
    })
  })

  it("handles session expiration", async () => {
    const unauthorizedResponse = {
      ok: false,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    } as Response

    mockFetch.mockResolvedValue(unauthorizedResponse)

    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    // Select and try to update claims
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    const approveButton = screen.getByText("Approve Selected (1)")
    fireEvent.click(approveButton)
    const updateButton = screen.getByText("Update Claims")
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        })
      )
    })
  })

  it("handles select all functionality", () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    const selectAllCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(selectAllCheckbox)

    expect(screen.getByText("Approve Selected (2)")).toBeInTheDocument()
  })

  it("handles dialog cancellation", () => {
    render(<ClaimsTable claims={mockClaims} onRefresh={mockOnRefresh} />)

    // Select claims and open dialog
    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    const approveButton = screen.getByText("Approve Selected (1)")
    fireEvent.click(approveButton)

    // Click cancel
    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    // Dialog should close
    expect(screen.queryByText("Update Claims")).not.toBeInTheDocument()
  })
}) 