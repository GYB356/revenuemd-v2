import { render } from "@testing-library/react"
import { screen, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom"
import DashboardPage from "@/app/dashboard/page"
import { UserActivityTable } from "@/components/UserActivityTable"
import { getTotalClaimsValue, getAverageClaimAmount } from "@/lib/analytics"

// Mock the analytics functions
jest.mock("@/lib/analytics", () => ({
  getTotalClaimsValue: jest.fn(),
  getAverageClaimAmount: jest.fn(),
}))

// Mock the UserActivityTable component
jest.mock("@/components/UserActivityTable", () => ({
  UserActivityTable: jest.fn(() => <div data-testid="user-activity-table" />),
}))

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up default mock values
    ;(getTotalClaimsValue as jest.Mock).mockResolvedValue(10000)
    ;(getAverageClaimAmount as jest.Mock).mockResolvedValue(500)
  })

  describe("DashboardPage", () => {
    it("renders the dashboard title", async () => {
      render(await DashboardPage())
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
    })

    it("displays total claims value", async () => {
      render(await DashboardPage())
      expect(screen.getByText("Total Claims Value")).toBeInTheDocument()
      expect(screen.getByText("$10000.00")).toBeInTheDocument()
    })

    it("displays average claim amount", async () => {
      render(await DashboardPage())
      expect(screen.getByText("Average Claim Amount")).toBeInTheDocument()
      expect(screen.getByText("$500.00")).toBeInTheDocument()
    })

    it("renders the user activity section", async () => {
      render(await DashboardPage())
      expect(screen.getByText("Recent User Activity")).toBeInTheDocument()
      expect(screen.getByTestId("user-activity-table")).toBeInTheDocument()
    })

    it("handles loading state for analytics data", async () => {
      // Mock slow data loading
      ;(getTotalClaimsValue as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(10000), 100))
      )
      ;(getAverageClaimAmount as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(500), 100))
      )

      const { container } = render(await DashboardPage())
      
      // Check for loading indicators
      expect(container.querySelector(".animate-spin")).toBeInTheDocument()
    })

    it("handles error state for analytics data", async () => {
      // Mock analytics error
      ;(getTotalClaimsValue as jest.Mock).mockRejectedValue(new Error("Failed to fetch"))
      ;(getAverageClaimAmount as jest.Mock).mockRejectedValue(new Error("Failed to fetch"))

      render(await DashboardPage())

      await waitFor(() => {
        expect(screen.getByText("Error loading analytics data")).toBeInTheDocument()
      })
    })
  })

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
    ]

    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activity: mockActivity }),
        })
      )
    })

    it("renders user activity data", async () => {
      render(<UserActivityTable />)

      await waitFor(() => {
        expect(screen.getByTestId("user-activity-table")).toBeInTheDocument()
      })
    })

    it("handles empty activity state", async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activity: [] }),
        })
      )

      render(<UserActivityTable />)

      await waitFor(() => {
        expect(screen.getByText("No recent activity")).toBeInTheDocument()
      })
    })

    it("handles loading state", async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<UserActivityTable />)

      expect(screen.getByText("Loading activity...")).toBeInTheDocument()
    })

    it("handles error state", async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error("Failed to fetch"))
      )

      render(<UserActivityTable />)

      await waitFor(() => {
        expect(screen.getByText("Error loading activity")).toBeInTheDocument()
      })
    })

    it("formats timestamps correctly", async () => {
      const timestamp = new Date().toISOString()
      const mockActivityWithTimestamp = [{
        ...mockActivity[0],
        timestamp,
      }]

      ;(global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activity: mockActivityWithTimestamp }),
        })
      )

      render(<UserActivityTable />)

      await waitFor(() => {
        expect(screen.getByText(new Date(timestamp).toLocaleString())).toBeInTheDocument()
      })
    })
  })
}) 