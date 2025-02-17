import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useRouter } from "next/navigation"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

describe("ErrorBoundary", () => {
  const mockError = new Error("Test error")
  const mockReset = jest.fn()
  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it("renders error message", () => {
    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error/i)).toBeInTheDocument()
  })

  it("logs error to console", () => {
    const consoleSpy = jest.spyOn(console, "error")
    
    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    expect(consoleSpy).toHaveBeenCalledWith(mockError)
  })

  it("calls reset function when retry button is clicked", () => {
    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    const retryButton = screen.getByRole("button", { name: /try again/i })
    fireEvent.click(retryButton)

    expect(mockReset).toHaveBeenCalled()
  })

  it("navigates to dashboard when dashboard button is clicked", () => {
    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    const dashboardButton = screen.getByRole("button", { name: /go to dashboard/i })
    fireEvent.click(dashboardButton)

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard")
  })

  it("displays custom error message for specific error types", () => {
    const notFoundError = new Error("Not Found")
    notFoundError.name = "NotFoundError"

    render(
      <ErrorBoundary
        error={notFoundError}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/The requested resource was not found/i)).toBeInTheDocument()
  })

  it("displays technical details in development environment", () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"

    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/Technical Details/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it("hides technical details in production environment", () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"

    render(
      <ErrorBoundary
        error={mockError}
        reset={mockReset}
      />
    )

    expect(screen.queryByText(/Technical Details/i)).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it("handles errors without message property", () => {
    const errorWithoutMessage = new Error()

    render(
      <ErrorBoundary
        error={errorWithoutMessage}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it("displays appropriate message for network errors", () => {
    const networkError = new Error("Failed to fetch")
    networkError.name = "NetworkError"

    render(
      <ErrorBoundary
        error={networkError}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument()
    expect(screen.getByText(/Please check your internet connection/i)).toBeInTheDocument()
  })

  it("displays appropriate message for authentication errors", () => {
    const authError = new Error("Unauthorized")
    authError.name = "AuthenticationError"

    render(
      <ErrorBoundary
        error={authError}
        reset={mockReset}
      />
    )

    expect(screen.getByText(/Authentication error/i)).toBeInTheDocument()
    expect(screen.getByText(/Please log in again/i)).toBeInTheDocument()
  })

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("renders error message when an error occurs", () => {
    const ThrowError = () => {
      throw new Error("Test error")
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    const fallback = <div>Custom Error Message</div>
    const ThrowError = () => {
      throw new Error("Test error")
    }

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText("Custom Error Message")).toBeInTheDocument()
  })

  it("resets error state when try again button is clicked", () => {
    const ThrowError = () => {
      throw new Error("Test error")
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const tryAgainButton = screen.getByRole("button", { name: /try again/i })
    fireEvent.click(tryAgainButton)

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  it("handles errors without messages", () => {
    const ThrowError = () => {
      throw new Error()
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument()
  })

  it("displays error digest when available", () => {
    const error = new Error("Test error")
    ;(error as any).digest = "error-123"
    const ThrowError = () => {
      throw error
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText("Error ID: error-123")).toBeInTheDocument()
  })
}) 