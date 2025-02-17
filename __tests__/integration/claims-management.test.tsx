import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { expect } from "@jest/globals"
import React from "react"
import { ClaimsTable } from "@/components/ClaimsTable"
import { ClaimDialog } from "@/components/ClaimDialog"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMedicalRecord } from "@/lib/mongodb"
import { logActivity } from "@/lib/activity-logger"
import { getTotalClaimsValue, getAverageClaimAmount } from "@/lib/analytics"
import { useToast } from "@/components/ui/use-toast"

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/mongodb")
jest.mock("@/lib/auth")
jest.mock("@/lib/activity-logger")
jest.mock("@/lib/analytics")
jest.mock("@/components/ui/use-toast")

describe("Claims Management Flow", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatient = {
    id: "patient-1",
    name: "John Doe",
    medicalRecordId: "record-1",
  }

  const mockMedicalRecord = {
    _id: "record-1",
    patientId: "patient-1",
    conditions: [{
      name: "Hypertension",
      diagnosisDate: new Date(),
      status: "active" as const,
    }],
    procedures: [{
      name: "Blood Pressure Check",
      date: new Date(),
      provider: "Dr. Smith",
    }],
  }

  const mockClaim = {
    id: "claim-1",
    patientId: "patient-1",
    amount: 150.00,
    status: "PENDING",
    procedureCodes: ["99211"],
    diagnosisCodes: ["I10"],
    notes: "Regular checkup",
  }

  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
    ;(getMedicalRecord as jest.Mock).mockResolvedValue(mockMedicalRecord)
    ;(getTotalClaimsValue as jest.Mock).mockResolvedValue(1000)
    ;(getAverageClaimAmount as jest.Mock).mockResolvedValue(200)
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  describe("Basic Claim Operations", () => {
    it("creates a new claim with medical record data", async () => {
      ;(prisma.claim.create as jest.Mock).mockResolvedValue(mockClaim)

      render(
        <React.Fragment>
          <ClaimDialog patientId={mockPatient.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new claim/i })
      fireEvent.click(createButton)

      // Verify medical record data is pre-populated
      await waitFor(() => {
        expect(screen.getByText("Hypertension")).toBeInTheDocument()
        expect(screen.getByText("Blood Pressure Check")).toBeInTheDocument()
      })

      // Fill form
      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: "150.00" } })

      const procedureCodeInput = screen.getByLabelText(/procedure code/i)
      fireEvent.change(procedureCodeInput, { target: { value: "99211" } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /submit claim/i })
      fireEvent.click(submitButton)

      // Verify claim was created
      await waitFor(() => {
        expect(prisma.claim.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              patientId: mockPatient.id,
              amount: 150.00,
              procedureCodes: ["99211"],
            }),
          })
        )
      })

      // Verify activity was logged
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: "CREATE_CLAIM",
          patientId: mockPatient.id,
        })
      )

      // Verify analytics were updated
      expect(getTotalClaimsValue).toHaveBeenCalled()
      expect(getAverageClaimAmount).toHaveBeenCalled()
    })

    it("updates claim status and refreshes analytics", async () => {
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim)
      ;(prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        status: "APPROVED",
      })

      render(
        <React.Fragment>
          <ClaimDialog claimId={mockClaim.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Open edit dialog
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      // Change status
      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.change(statusSelect, { target: { value: "APPROVED" } })

      // Submit changes
      const saveButton = screen.getByRole("button", { name: /save changes/i })
      fireEvent.click(saveButton)

      // Verify update was called
      await waitFor(() => {
        expect(prisma.claim.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockClaim.id },
            data: expect.objectContaining({
              status: "APPROVED",
            }),
          })
        )
      })

      // Verify analytics were refreshed
      expect(getTotalClaimsValue).toHaveBeenCalled()
      expect(getAverageClaimAmount).toHaveBeenCalled()
    })
  })

  describe("Validation and Error Handling", () => {
    it("validates required fields", async () => {
      render(<ClaimDialog patientId={mockPatient.id} />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new claim/i })
      fireEvent.click(createButton)

      // Submit without filling required fields
      const submitButton = screen.getByRole("button", { name: /submit claim/i })
      fireEvent.click(submitButton)

      // Verify validation messages
      await waitFor(() => {
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument()
        expect(screen.getByText(/procedure codes are required/i)).toBeInTheDocument()
      })

      expect(prisma.claim.create).not.toHaveBeenCalled()
    })

    it("validates claim amount against medical record procedures", async () => {
      render(<ClaimDialog patientId={mockPatient.id} />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new claim/i })
      fireEvent.click(createButton)

      // Enter suspiciously high amount
      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: "10000.00" } })

      // Verify warning is displayed
      await waitFor(() => {
        expect(screen.getByText(/amount seems unusually high/i)).toBeInTheDocument()
      })

      // Verify submit button is not disabled but shows warning
      const submitButton = screen.getByRole("button", { name: /submit claim/i })
      expect(submitButton).toBeEnabled()
      expect(submitButton).toHaveAttribute("aria-label", expect.stringContaining("warning"))
    })

    it("prevents duplicate claims for same procedure", async () => {
      ;(prisma.claim.findFirst as jest.Mock).mockResolvedValue(mockClaim)

      render(<ClaimDialog patientId={mockPatient.id} />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new claim/i })
      fireEvent.click(createButton)

      // Enter same procedure code
      const procedureCodeInput = screen.getByLabelText(/procedure code/i)
      fireEvent.change(procedureCodeInput, { target: { value: "99211" } })

      // Verify warning is displayed
      await waitFor(() => {
        expect(screen.getByText(/existing claim found/i)).toBeInTheDocument()
      })

      // Verify submit button is disabled
      const submitButton = screen.getByRole("button", { name: /submit claim/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe("Edge Cases", () => {
    it("handles concurrent updates to the same claim", async () => {
      const concurrencyError = new Error("Version mismatch")
      ;(prisma.claim.update as jest.Mock)
        .mockRejectedValueOnce(concurrencyError)
        .mockResolvedValueOnce({ ...mockClaim, status: "APPROVED" })

      render(
        <React.Fragment>
          <ClaimDialog claimId={mockClaim.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Try to update claim
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      const statusSelect = screen.getByLabelText(/status/i)
      fireEvent.change(statusSelect, { target: { value: "APPROVED" } })

      const saveButton = screen.getByRole("button", { name: /save changes/i })
      fireEvent.click(saveButton)

      // Verify error handling and retry
      await waitFor(() => {
        expect(screen.getByText(/claim was modified by another user/i)).toBeInTheDocument()
        expect(screen.getByText(/retrying update/i)).toBeInTheDocument()
      })

      // Verify successful retry
      await waitFor(() => {
        expect(prisma.claim.update).toHaveBeenCalledTimes(2)
        expect(screen.getByText(/claim updated successfully/i)).toBeInTheDocument()
      })
    })

    it("prevents claim updates after final adjudication", async () => {
      const adjudicatedClaim = { ...mockClaim, status: "PAID" }
      ;(prisma.claim.findUnique as jest.Mock).mockResolvedValue(adjudicatedClaim)

      render(
        <React.Fragment>
          <ClaimDialog claimId={adjudicatedClaim.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Try to edit paid claim
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      // Verify editing is prevented
      await waitFor(() => {
        expect(screen.getByText(/claim is finalized/i)).toBeInTheDocument()
        expect(screen.getByText(/cannot modify paid claims/i)).toBeInTheDocument()
      })

      // All form fields should be disabled
      const formInputs = screen.getAllByRole("textbox")
      formInputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it("handles session timeout during claim submission", async () => {
      ;(verifyAuth as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)

      render(<ClaimDialog patientId={mockPatient.id} />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new claim/i })
      fireEvent.click(createButton)

      // Fill form
      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: "150.00" } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /submit claim/i })
      fireEvent.click(submitButton)

      // Verify session timeout handling
      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument()
        expect(screen.getByText(/please log in again/i)).toBeInTheDocument()
      })

      // Verify form data is preserved
      expect(amountInput).toHaveValue("150.00")
    })
  })

  describe("Batch Operations", () => {
    it("handles bulk claim status updates", async () => {
      const claims = [
        mockClaim,
        { ...mockClaim, id: "claim-2", status: "PENDING" },
        { ...mockClaim, id: "claim-3", status: "PENDING" },
      ]
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(claims)
      ;(prisma.claim.updateMany as jest.Mock).mockResolvedValue({ count: 2 })

      render(<ClaimsTable patientId={mockPatient.id} />)

      // Select multiple claims
      const checkboxes = screen.getAllByRole("checkbox")
      fireEvent.click(checkboxes[1]) // First claim
      fireEvent.click(checkboxes[2]) // Second claim

      // Open bulk update dialog
      const bulkUpdateButton = screen.getByRole("button", { name: /update selected/i })
      fireEvent.click(bulkUpdateButton)

      // Change status for selected claims
      const statusSelect = screen.getByLabelText(/new status/i)
      fireEvent.change(statusSelect, { target: { value: "APPROVED" } })

      // Submit bulk update
      const submitButton = screen.getByRole("button", { name: /update claims/i })
      fireEvent.click(submitButton)

      // Verify bulk update
      await waitFor(() => {
        expect(prisma.claim.updateMany).toHaveBeenCalledWith({
          where: {
            id: { in: ["claim-2", "claim-3"] },
            status: "PENDING",
          },
          data: { status: "APPROVED" },
        })
      })

      // Verify success message
      expect(screen.getByText(/2 claims updated successfully/i)).toBeInTheDocument()
    })
  })

  describe("Role-Based Access Control", () => {
    it("restricts access to detailed analytics for non-admin users", async () => {
      const regularUser = { ...mockUser, role: "USER" }
      ;(verifyAuth as jest.Mock).mockResolvedValue(regularUser)

      render(
        <React.Fragment>
          <ClaimDialog patientId={mockPatient.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Try to access detailed analytics
      const analyticsButton = screen.getByRole("button", { name: /view detailed analytics/i })
      fireEvent.click(analyticsButton)

      // Verify access is denied
      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
        expect(screen.getByText(/requires admin role/i)).toBeInTheDocument()
      })
    })

    it("allows admin users to access all features", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({ ...mockUser, role: "ADMIN" })

      render(
        <React.Fragment>
          <ClaimDialog patientId={mockPatient.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Verify admin features are accessible
      const bulkActionsButton = screen.getByRole("button", { name: /bulk actions/i })
      expect(bulkActionsButton).toBeEnabled()

      const analyticsButton = screen.getByRole("button", { name: /view detailed analytics/i })
      expect(analyticsButton).toBeEnabled()
    })
  })

  describe("Caching Behavior", () => {
    it("uses cached data when available", async () => {
      const cachedClaims = [{ ...mockClaim, id: "cached-1" }]
      ;(getCachedData as jest.Mock).mockResolvedValue(cachedClaims)

      render(<ClaimsTable patientId={mockPatient.id} />)

      // Verify cached data is displayed
      await waitFor(() => {
        expect(screen.getByText("cached-1")).toBeInTheDocument()
        expect(prisma.claim.findMany).not.toHaveBeenCalled()
      })
    })

    it("fetches fresh data when cache is invalid", async () => {
      ;(getCachedData as jest.Mock).mockResolvedValue(null)
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue([mockClaim])

      render(<ClaimsTable patientId={mockPatient.id} />)

      // Verify fresh data is fetched and displayed
      await waitFor(() => {
        expect(prisma.claim.findMany).toHaveBeenCalled()
        expect(setCachedData).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([mockClaim])
        )
      })
    })
  })

  describe("Error Recovery", () => {
    it("retries failed API calls with exponential backoff", async () => {
      const networkError = new Error("Network error")
      ;(prisma.claim.findMany as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce([mockClaim])

      render(<ClaimsTable patientId={mockPatient.id} />)

      // Verify retry behavior
      await waitFor(() => {
        expect(screen.getByText(/retrying/i)).toBeInTheDocument()
      })

      // Verify successful recovery
      await waitFor(() => {
        expect(screen.getByText(mockClaim.id)).toBeInTheDocument()
        expect(prisma.claim.findMany).toHaveBeenCalledTimes(3)
      })
    })

    it("handles session expiration during long operations", async () => {
      ;(verifyAuth as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)

      render(
        <React.Fragment>
          <ClaimDialog patientId={mockPatient.id} />
          <ClaimsTable patientId={mockPatient.id} />
        </React.Fragment>
      )

      // Start a bulk operation
      const checkboxes = screen.getAllByRole("checkbox")
      fireEvent.click(checkboxes[1])
      fireEvent.click(checkboxes[2])

      const bulkUpdateButton = screen.getByRole("button", { name: /update selected/i })
      fireEvent.click(bulkUpdateButton)

      // Verify session expiration handling
      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument()
        expect(screen.getByText(/please log in again/i)).toBeInTheDocument()
      })

      // Verify selected items are preserved
      expect(checkboxes[1]).toBeChecked()
      expect(checkboxes[2]).toBeChecked()
    })
  })

  describe("Form State Management", () => {
    it("preserves form state during navigation", async () => {
      render(<ClaimDialog patientId={mockPatient.id} />)

      // Fill form
      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: "150.00" } })

      const procedureCodeInput = screen.getByLabelText(/procedure code/i)
      fireEvent.change(procedureCodeInput, { target: { value: "99211" } })

      // Simulate navigation
      const event = new Event("beforeunload")
      window.dispatchEvent(event)

      // Return to form
      render(<ClaimDialog patientId={mockPatient.id} />)

      // Verify form state is preserved
      expect(amountInput).toHaveValue("150.00")
      expect(procedureCodeInput).toHaveValue("99211")
    })

    it("warns about unsaved changes", async () => {
      render(<ClaimDialog patientId={mockPatient.id} />)

      // Fill form
      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: "150.00" } })

      // Try to close dialog
      const closeButton = screen.getByRole("button", { name: /close/i })
      fireEvent.click(closeButton)

      // Verify warning
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
        expect(screen.getByText(/do you want to save/i)).toBeInTheDocument()
      })
    })
  })
}) 