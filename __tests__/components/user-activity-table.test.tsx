import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { UserActivityTable } from "@/components/UserActivityTable"
import { getRecentActivity } from "@/lib/analytics"

// Mock analytics function
jest.mock("@/lib/analytics", () => ({
  getRecentActivity: jest.fn(),
}))

describe("UserActivityTable", () => {
  const mockActivity = [
    {
      id: "1",
      type: "CLAIM_UPDATE",
      timestamp: new Date().toISOString(),
      details: "Claim ABC123 was updated",
      user: {
        name: "John Doe",
        email: "john@example.com",
      },
    },
    {
      id: "2",
      type: "PATIENT_CREATE",
      timestamp: new Date().toISOString(),
      details: "New patient XYZ789 was created",
      user: {
        name: "Jane Smith",
        email: "jane@example.com",
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getRecentActivity as jest.Mock).mockResolvedValue(mockActivity)
  })

  it("renders activity data correctly", async () => {
    render(<UserActivityTable />)

    await waitFor(() => {
      expect(screen.getByText("Claim ABC123 was updated")).toBeInTheDocument()
      expect(screen.getByText("New patient XYZ789 was created")).toBeInTheDocument()
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    })
  })

  it("displays loading state", () => {
    ;(getRecentActivity as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<UserActivityTable />)

    expect(screen.getByText("Loading activity...")).toBeInTheDocument()
  })

  it("handles empty activity state", async () => {
    ;(getRecentActivity as jest.Mock).mockResolvedValue([])

    render(<UserActivityTable />)

    await waitFor(() => {
      expect(screen.getByText("No recent activity")).toBeInTheDocument()
    })
  })

  it("handles error state", async () => {
    ;(getRecentActivity as jest.Mock).mockRejectedValue(new Error("Failed to fetch"))

    render(<UserActivityTable />)

    await waitFor(() => {
      expect(screen.getByText("Error loading activity")).toBeInTheDocument()
    })
  })

  it("formats timestamps correctly", async () => {
    const now = new Date()
    const mockActivityWithTimestamp = [{
      ...mockActivity[0],
      timestamp: now.toISOString(),
    }]

    ;(getRecentActivity as jest.Mock).mockResolvedValue(mockActivityWithTimestamp)

    render(<UserActivityTable />)

    await waitFor(() => {
      expect(screen.getByText(now.toLocaleString())).toBeInTheDocument()
    })
  })

  it("displays activity type badges with correct styles", async () => {
    render(<UserActivityTable />)

    await waitFor(() => {
      const claimBadge = screen.getByText("CLAIM_UPDATE")
      const patientBadge = screen.getByText("PATIENT_CREATE")

      expect(claimBadge).toHaveClass("bg-blue-100")
      expect(patientBadge).toHaveClass("bg-green-100")
    })
  })

  it("truncates long activity details", async () => {
    const longDetail = "A".repeat(100)
    const mockActivityWithLongDetail = [{
      ...mockActivity[0],
      details: longDetail,
    }]

    ;(getRecentActivity as jest.Mock).mockResolvedValue(mockActivityWithLongDetail)

    render(<UserActivityTable />)

    await waitFor(() => {
      const displayedText = screen.getByText(/A+/)
      expect(displayedText.textContent?.length).toBeLessThan(longDetail.length)
    })
  })

  it("displays user email on hover", async () => {
    render(<UserActivityTable />)

    await waitFor(() => {
      const userElement = screen.getByText("John Doe")
      expect(userElement).toHaveAttribute("title", "john@example.com")
    })
  })
}) 