import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NewClaimPage from "@/app/dashboard/claims/new/page"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAuth } from "@/hooks/useAuth"
import { AttachmentService } from "@/lib/services/AttachmentService"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/lib/services/AttachmentService", () => ({
  AttachmentService: {
    upload: jest.fn(),
  },
}))

describe("New Claim Page", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false, error: null })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "claim-1" }),
    })
  })

  it("renders the new claim form", () => {
    render(<NewClaimPage />)

    expect(screen.getByText(/submit new claim/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/patient/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/procedure codes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/diagnosis codes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/attachments/i)).toBeInTheDocument()
  })

  it("handles successful claim submission", async () => {
    render(<NewClaimPage />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: "patient-1" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100.00" },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: "99213" },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: "I10" },
    })

    // Upload file
    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const fileInput = screen.getByLabelText(/attachments/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/claims",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
      expect(toast.success).toHaveBeenCalledWith("Claim submitted successfully")
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/claims")
    })
  })

  it("handles unauthorized access", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null, loading: false, error: null })
    render(<NewClaimPage />)

    // Fill out form minimally and submit
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: "patient-1" },
    })
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized")
      expect(mockRouter.push).toHaveBeenCalledWith("/login")
    })
  })

  it("handles validation errors", async () => {
    render(<NewClaimPage />)

    // Submit empty form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(screen.getByText(/patient is required/i)).toBeInTheDocument()
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one procedure code is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one diagnosis code is required/i)).toBeInTheDocument()
    })
  })

  it("handles API errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to create claim" }),
    })

    render(<NewClaimPage />)

    // Fill out form minimally
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: "patient-1" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100.00" },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: "99213" },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: "I10" },
    })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to submit claim")
    })
  })

  it("handles file upload errors", async () => {
    ;(AttachmentService.upload as jest.Mock).mockRejectedValue(
      new Error("Upload failed")
    )

    render(<NewClaimPage />)

    // Fill out form and add file
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: "patient-1" },
    })
    const file = new File(["test"], "test.pdf", { type: "application/pdf" })
    const fileInput = screen.getByLabelText(/attachments/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to upload file")
    })
  })

  it("disables form during submission", async () => {
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<NewClaimPage />)

    // Fill out form minimally and submit
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: "patient-1" },
    })
    fireEvent.click(screen.getByText(/submit claim/i))

    expect(screen.getByLabelText(/patient/i)).toBeDisabled()
    expect(screen.getByLabelText(/amount/i)).toBeDisabled()
    expect(screen.getByText(/submitting\.\.\./i)).toBeInTheDocument()
  })

  it("navigates back on cancel", () => {
    render(<NewClaimPage />)

    fireEvent.click(screen.getByText(/cancel/i))
    expect(mockRouter.back).toHaveBeenCalled()
  })
}) 