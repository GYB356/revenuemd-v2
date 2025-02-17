import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { expect } from "@jest/globals"
import React from "react"
import { PatientTable } from "@/components/PatientTable"
import { PatientDialog } from "@/components/PatientDialog"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import { useToast } from "@/components/ui/use-toast"

// Add Jest matchers type augmentation
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
    }
  }
}

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/activity-logger")
jest.mock("@/components/ui/use-toast")

describe("Patient Management Integration Flow", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatient = {
    id: "patient-1",
    name: "John Doe",
    email: "john@example.com",
    dateOfBirth: new Date("1990-01-01").toISOString(),
    gender: "MALE",
    phoneNumber: "+1234567890",
    address: "123 Main St",
    insuranceProvider: "Blue Cross",
    insuranceNumber: "INS123456",
    medicalHistory: ["Hypertension", "Diabetes"],
    allergies: ["Penicillin"],
    _count: { claims: 2 },
  }

  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  describe("Patient Creation Flow", () => {
    it("creates a new patient with valid data", async () => {
      ;(prisma.patient.create as jest.Mock).mockResolvedValue(mockPatient)

      render(
        <>
          <PatientDialog />
          <PatientTable />
        </>
      )

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new patient/i })
      fireEvent.click(createButton)

      // Fill form with valid data
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const dobInput = screen.getByLabelText(/date of birth/i)
      const insuranceInput = screen.getByLabelText(/insurance provider/i)

      fireEvent.change(nameInput, { target: { value: mockPatient.name } })
      fireEvent.change(emailInput, { target: { value: mockPatient.email } })
      fireEvent.change(dobInput, { target: { value: "1990-01-01" } })
      fireEvent.change(insuranceInput, { target: { value: mockPatient.insuranceProvider } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify patient creation
      await waitFor(() => {
        expect(prisma.patient.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: mockPatient.name,
            email: mockPatient.email,
          }),
        })
      })

      // Verify activity logging
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: "CREATE_PATIENT",
        patientId: mockPatient.id,
      })

      // Verify success notification
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Success",
          description: "Patient created successfully",
        })
      )
    })

    it("validates required fields", async () => {
      render(<PatientDialog />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /new patient/i })
      fireEvent.click(createButton)

      // Submit form without filling required fields
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify validation messages
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument()
      })

      // Verify patient was not created
      expect(prisma.patient.create).not.toHaveBeenCalled()
    })

    it("validates email format", async () => {
      render(<PatientDialog />)

      // Open create dialog and fill invalid email
      const createButton = screen.getByRole("button", { name: /new patient/i })
      fireEvent.click(createButton)

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: "invalid-email" } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify validation message
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it("handles duplicate email error", async () => {
      ;(prisma.patient.create as jest.Mock).mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)")
      )

      render(<PatientDialog />)

      // Open create dialog and fill form
      const createButton = screen.getByRole("button", { name: /new patient/i })
      fireEvent.click(createButton)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      fireEvent.change(nameInput, { target: { value: mockPatient.name } })
      fireEvent.change(emailInput, { target: { value: mockPatient.email } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify error handling
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            description: "A patient with this email already exists",
            variant: "destructive",
          })
        )
      })
    })
  })

  describe("Patient Update Flow", () => {
    it("updates patient information", async () => {
      const updatedPatient = {
        ...mockPatient,
        name: "John Smith",
        phoneNumber: "+1987654321",
      }
      ;(prisma.patient.update as jest.Mock).mockResolvedValue(updatedPatient)

      render(
        <>
          <PatientDialog patientId={mockPatient.id} />
          <PatientTable />
        </>
      )

      // Open edit dialog
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      // Update fields
      const nameInput = screen.getByLabelText(/name/i)
      const phoneInput = screen.getByLabelText(/phone/i)

      fireEvent.change(nameInput, { target: { value: updatedPatient.name } })
      fireEvent.change(phoneInput, { target: { value: updatedPatient.phoneNumber } })

      // Submit changes
      const saveButton = screen.getByRole("button", { name: /save changes/i })
      fireEvent.click(saveButton)

      // Verify update
      await waitFor(() => {
        expect(prisma.patient.update).toHaveBeenCalledWith({
          where: { id: mockPatient.id },
          data: expect.objectContaining({
            name: updatedPatient.name,
            phoneNumber: updatedPatient.phoneNumber,
          }),
        })
      })

      // Verify activity logging
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: "UPDATE_PATIENT",
        patientId: mockPatient.id,
      })
    })

    it("prevents updates to immutable fields", async () => {
      render(<PatientDialog patientId={mockPatient.id} />)

      // Open edit dialog
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      // Verify immutable fields are disabled
      const insuranceNumberInput = screen.getByLabelText(/insurance number/i)
      expect(insuranceNumberInput).toBeDisabled()
    })
  })

  describe("Patient Search and Filtering", () => {
    const mockPatients = [
      mockPatient,
      {
        ...mockPatient,
        id: "patient-2",
        name: "Jane Smith",
        insuranceProvider: "Aetna",
      },
    ]

    beforeEach(() => {
      ;(prisma.patient.findMany as jest.Mock).mockResolvedValue(mockPatients)
    })

    it("filters patients by insurance provider", async () => {
      render(<PatientTable />)

      const filterInput = screen.getByLabelText(/filter by insurance/i)
      fireEvent.change(filterInput, { target: { value: "Blue Cross" } })

      await waitFor(() => {
        expect(prisma.patient.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              insuranceProvider: expect.stringContaining("Blue Cross"),
            }),
          })
        )
      })
    })

    it("searches patients by name or email", async () => {
      render(<PatientTable />)

      const searchInput = screen.getByPlaceholderText(/search patients/i)
      fireEvent.change(searchInput, { target: { value: "john" } })

      await waitFor(() => {
        expect(prisma.patient.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: [
                { name: expect.objectContaining({ contains: "john" }) },
                { email: expect.objectContaining({ contains: "john" }) },
              ],
            }),
          })
        )
      })
    })
  })

  describe("Patient Deletion Flow", () => {
    it("prevents deletion if patient has active claims", async () => {
      render(<PatientTable />)

      const deleteButton = screen.getByRole("button", { name: /delete/i })
      fireEvent.click(deleteButton)

      // Verify warning
      expect(screen.getByText(/cannot delete patient with active claims/i)).toBeInTheDocument()
      expect(prisma.patient.delete).not.toHaveBeenCalled()
    })

    it("requires confirmation for deletion", async () => {
      ;(mockPatient._count.claims as number) = 0
      render(<PatientTable />)

      const deleteButton = screen.getByRole("button", { name: /delete/i })
      fireEvent.click(deleteButton)

      // Verify confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()

      // Cancel deletion
      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(prisma.patient.delete).not.toHaveBeenCalled()
    })

    it("successfully deletes patient without claims", async () => {
      ;(mockPatient._count.claims as number) = 0
      ;(prisma.patient.delete as jest.Mock).mockResolvedValue(mockPatient)

      render(<PatientTable />)

      // Initiate deletion
      const deleteButton = screen.getByRole("button", { name: /delete/i })
      fireEvent.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole("button", { name: /confirm/i })
      fireEvent.click(confirmButton)

      // Verify deletion
      await waitFor(() => {
        expect(prisma.patient.delete).toHaveBeenCalledWith({
          where: { id: mockPatient.id },
        })
      })

      // Verify activity logging
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: "DELETE_PATIENT",
        patientId: mockPatient.id,
      })

      // Verify success notification
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Success",
          description: "Patient deleted successfully",
        })
      )
    })
  })
}) 