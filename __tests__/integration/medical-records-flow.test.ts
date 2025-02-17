import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { expect } from "@jest/globals"
import React from "react"
import { MedicalRecordsTable } from "@/components/MedicalRecordsTable"
import { MedicalRecordDialog } from "@/components/MedicalRecordDialog"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMedicalRecord, createMedicalRecord, updateMedicalRecord } from "@/lib/mongodb"
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
    }
  }
}

// Mock dependencies
jest.mock("@/lib/db")
jest.mock("@/lib/auth")
jest.mock("@/lib/mongodb")
jest.mock("@/lib/activity-logger")
jest.mock("@/components/ui/use-toast")

describe("Medical Records Integration Flow", () => {
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
    history: {
      smoking: false,
      alcohol: "occasional",
      exercise: "moderate",
    },
    allergies: ["Penicillin"],
    medications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "daily",
        startDate: new Date("2023-01-01"),
      },
    ],
    conditions: [
      {
        name: "Hypertension",
        diagnosisDate: new Date("2023-01-01"),
        status: "active",
      },
    ],
    vitals: [
      {
        type: "blood_pressure",
        value: 120,
        unit: "mmHg",
        date: new Date(),
      },
    ],
  }

  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
    ;(getMedicalRecord as jest.Mock).mockResolvedValue(mockMedicalRecord)
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  describe("Medical Record Creation", () => {
    it("creates a new medical record with valid data", async () => {
      ;(createMedicalRecord as jest.Mock).mockResolvedValue({
        insertedId: "record-1",
      })

      render(
        <>
          <MedicalRecordDialog patientId={mockPatient.id} />
          <MedicalRecordsTable />
        </>
      )

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /add medical record/i })
      fireEvent.click(createButton)

      // Fill form
      const allergyInput = screen.getByLabelText(/allergies/i)
      fireEvent.change(allergyInput, { target: { value: "Penicillin" } })

      const medicationNameInput = screen.getByLabelText(/medication name/i)
      fireEvent.change(medicationNameInput, { target: { value: "Lisinopril" } })

      const medicationDosageInput = screen.getByLabelText(/dosage/i)
      fireEvent.change(medicationDosageInput, { target: { value: "10mg" } })

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify creation
      await waitFor(() => {
        expect(createMedicalRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: mockPatient.id,
            allergies: ["Penicillin"],
            medications: [
              expect.objectContaining({
                name: "Lisinopril",
                dosage: "10mg",
              }),
            ],
          })
        )
      })

      // Verify activity logging
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: "CREATE_MEDICAL_RECORD",
        patientId: mockPatient.id,
      })
    })

    it("validates required fields", async () => {
      render(<MedicalRecordDialog patientId={mockPatient.id} />)

      // Open create dialog
      const createButton = screen.getByRole("button", { name: /add medical record/i })
      fireEvent.click(createButton)

      // Submit without filling required fields
      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify validation messages
      await waitFor(() => {
        expect(screen.getByText(/medical history is required/i)).toBeInTheDocument()
      })

      expect(createMedicalRecord).not.toHaveBeenCalled()
    })
  })

  describe("Medical Record Updates", () => {
    it("updates existing medical record", async () => {
      const updatedRecord = {
        ...mockMedicalRecord,
        allergies: [...mockMedicalRecord.allergies, "Aspirin"],
      }
      ;(updateMedicalRecord as jest.Mock).mockResolvedValue({ modifiedCount: 1 })

      render(
        <>
          <MedicalRecordDialog 
            patientId={mockPatient.id}
            medicalRecordId={mockMedicalRecord._id}
          />
          <MedicalRecordsTable />
        </>
      )

      // Open edit dialog
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      // Add new allergy
      const allergyInput = screen.getByLabelText(/allergies/i)
      fireEvent.change(allergyInput, { target: { value: "Aspirin" } })
      const addAllergyButton = screen.getByRole("button", { name: /add allergy/i })
      fireEvent.click(addAllergyButton)

      // Submit changes
      const saveButton = screen.getByRole("button", { name: /save changes/i })
      fireEvent.click(saveButton)

      // Verify update
      await waitFor(() => {
        expect(updateMedicalRecord).toHaveBeenCalledWith(
          mockPatient.id,
          expect.objectContaining({
            allergies: ["Penicillin", "Aspirin"],
          })
        )
      })

      // Verify activity logging
      expect(logActivity).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: "UPDATE_MEDICAL_RECORD",
        patientId: mockPatient.id,
      })
    })
  })

  describe("Error Handling", () => {
    it("handles network errors during save", async () => {
      const networkError = new Error("Network error")
      ;(createMedicalRecord as jest.Mock).mockRejectedValue(networkError)

      render(<MedicalRecordDialog patientId={mockPatient.id} />)

      // Open create dialog and submit
      const createButton = screen.getByRole("button", { name: /add medical record/i })
      fireEvent.click(createButton)

      const submitButton = screen.getByRole("button", { name: /save/i })
      fireEvent.click(submitButton)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to save medical record/i)).toBeInTheDocument()
        expect(screen.getByText(/please try again/i)).toBeInTheDocument()
      })
    })

    it("handles concurrent update conflicts", async () => {
      const concurrencyError = new Error("Version mismatch")
      ;(updateMedicalRecord as jest.Mock)
        .mockRejectedValueOnce(concurrencyError)
        .mockResolvedValueOnce({ modifiedCount: 1 })

      render(
        <MedicalRecordDialog 
          patientId={mockPatient.id}
          medicalRecordId={mockMedicalRecord._id}
        />
      )

      // Open edit dialog and submit
      const editButton = screen.getByRole("button", { name: /edit/i })
      fireEvent.click(editButton)

      const saveButton = screen.getByRole("button", { name: /save changes/i })
      fireEvent.click(saveButton)

      // Verify error handling and retry
      await waitFor(() => {
        expect(screen.getByText(/record was modified by another user/i)).toBeInTheDocument()
        expect(screen.getByText(/retrying update/i)).toBeInTheDocument()
      })

      // Verify successful retry
      await waitFor(() => {
        expect(updateMedicalRecord).toHaveBeenCalledTimes(2)
        expect(screen.getByText(/record updated successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe("File Attachments", () => {
    it("handles file upload errors", async () => {
      render(<MedicalRecordDialog patientId={mockPatient.id} />)

      // Mock file upload error
      const uploadError = new Error("Upload failed")
      global.fetch = jest.fn().mockRejectedValue(uploadError)

      // Trigger file upload
      const fileInput = screen.getByLabelText(/upload files/i)
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to upload file/i)).toBeInTheDocument()
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            description: "Failed to upload file. Please try again.",
            variant: "destructive",
          })
        )
      })
    })

    it("validates file size and type", async () => {
      render(<MedicalRecordDialog patientId={mockPatient.id} />)

      // Create large file
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      })

      // Trigger file upload
      const fileInput = screen.getByLabelText(/upload files/i)
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      // Verify size validation
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds 5MB limit/i)).toBeInTheDocument()
      })

      // Create invalid file type
      const invalidFile = new File(["test"], "test.exe", {
        type: "application/x-msdownload",
      })
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      // Verify type validation
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
      })
    })
  })
}) 