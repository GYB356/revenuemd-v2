import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { expect } from "@jest/globals"
import React from "react"
import { ExportButtons } from "@/components/ExportButtons"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import { exportToCSV, exportToJSON } from "@/lib/export"
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
jest.mock("@/lib/activity-logger")
jest.mock("@/lib/export")
jest.mock("@/components/ui/use-toast")

describe("Export Integration Flow", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    role: "ADMIN",
  }

  const mockPatients = [
    {
      id: "patient-1",
      name: "John Doe",
      dateOfBirth: new Date("1990-01-01").toISOString(),
      gender: "MALE",
      contactInfo: "john@example.com",
      _count: { claims: 2 },
    },
    {
      id: "patient-2",
      name: "Jane Smith",
      dateOfBirth: new Date("1985-05-15").toISOString(),
      gender: "FEMALE",
      contactInfo: "jane@example.com",
      _count: { claims: 1 },
    },
  ]

  const mockClaims = [
    {
      id: "claim-1",
      patientId: "patient-1",
      amount: 150.00,
      status: "APPROVED",
      procedureCodes: ["99211"],
      diagnosisCodes: ["I10"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "claim-2",
      patientId: "patient-1",
      amount: 200.00,
      status: "PENDING",
      procedureCodes: ["99213"],
      diagnosisCodes: ["E11"],
      createdAt: new Date().toISOString(),
    },
  ]

  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findMany as jest.Mock).mockResolvedValue(mockPatients)
    ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims)
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  describe("Patient Data Export", () => {
    it("exports patient data to CSV", async () => {
      // Mock CSV export
      const csvData = "name,dateOfBirth,gender,contactInfo,totalClaims\n"
        + "John Doe,1990-01-01,MALE,john@example.com,2\n"
        + "Jane Smith,1985-05-15,FEMALE,jane@example.com,1"
      ;(exportToCSV as jest.Mock).mockResolvedValue(csvData)

      // Render export buttons
      render(<ExportButtons type="patients" />)

      // Click CSV export button
      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      // Verify export was triggered
      await waitFor(() => {
        expect(exportToCSV).toHaveBeenCalledWith(mockPatients)
      })

      // Verify activity was logged
      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: "EXPORT_DATA",
          details: "Exported patients data as CSV",
        })
      )

      // Verify success toast was shown
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export Successful",
          description: expect.stringContaining("CSV"),
        })
      )
    })

    it("exports patient data to JSON", async () => {
      // Mock JSON export
      const jsonData = JSON.stringify(mockPatients, null, 2)
      ;(exportToJSON as jest.Mock).mockResolvedValue(jsonData)

      render(<ExportButtons type="patients" />)

      const jsonButton = screen.getByRole("button", { name: /export json/i })
      fireEvent.click(jsonButton)

      await waitFor(() => {
        expect(exportToJSON).toHaveBeenCalledWith(mockPatients)
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "EXPORT_DATA",
          details: "Exported patients data as JSON",
        })
      )
    })

    it("handles export errors gracefully", async () => {
      // Mock export error
      const errorMessage = "Failed to export data"
      ;(exportToCSV as jest.Mock).mockRejectedValue(new Error(errorMessage))

      render(<ExportButtons type="patients" />)

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Export Failed",
            description: expect.stringContaining(errorMessage),
            variant: "destructive",
          })
        )
      })
    })
  })

  describe("Claims Data Export", () => {
    it("exports claims data with patient information", async () => {
      // Mock CSV export with joined data
      const csvData = "id,patientName,amount,status,procedureCodes,diagnosisCodes\n"
        + "claim-1,John Doe,150.00,APPROVED,99211,I10\n"
        + "claim-2,John Doe,200.00,PENDING,99213,E11"
      ;(exportToCSV as jest.Mock).mockResolvedValue(csvData)

      render(<ExportButtons type="claims" />)

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(exportToCSV).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: "claim-1",
              patientId: "patient-1",
            }),
          ])
        )
      })
    })

    it("applies date range filter to export", async () => {
      const startDate = new Date("2024-01-01")
      const endDate = new Date("2024-03-31")

      render(
        <ExportButtons
          type="claims"
          filters={{ startDate, endDate }}
        />
      )

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(prisma.claim.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }),
          })
        )
      })
    })

    it("handles large datasets with pagination", async () => {
      // Mock large dataset
      const largeClaims = Array.from({ length: 1000 }, (_, i) => ({
        ...mockClaims[0],
        id: `claim-${i}`,
      }))
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValue(largeClaims)

      render(<ExportButtons type="claims" />)

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      // Verify loading state
      expect(screen.getByText(/preparing export/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(exportToCSV).toHaveBeenCalledWith(
          expect.arrayContaining(largeClaims)
        )
      })

      // Verify progress was shown
      expect(screen.getByText(/export complete/i)).toBeInTheDocument()
    })
  })

  describe("Export Security", () => {
    it("prevents unauthorized exports", async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue(null)

      render(<ExportButtons type="patients" />)

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Export Failed",
            description: "Unauthorized",
            variant: "destructive",
          })
        )
      })

      expect(exportToCSV).not.toHaveBeenCalled()
    })

    it("filters sensitive data from exports", async () => {
      render(<ExportButtons type="patients" />)

      const csvButton = screen.getByRole("button", { name: /export csv/i })
      fireEvent.click(csvButton)

      await waitFor(() => {
        expect(exportToCSV).toHaveBeenCalledWith(
          expect.not.arrayContaining([
            expect.objectContaining({
              ssn: expect.any(String),
              password: expect.any(String),
            }),
          ])
        )
      })
    })
  })
}) 