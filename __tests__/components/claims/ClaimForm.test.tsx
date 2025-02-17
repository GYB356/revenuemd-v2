import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClaimForm } from '@/components/claims/ClaimForm'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ClaimForm', () => {
  const mockOnSubmit = jest.fn()
  const mockInitialData = {
    patientId: 'patient-1',
    amount: '100.00',
    procedureCodes: ['99213'],
    diagnosisCodes: ['I10'],
    notes: 'Initial notes',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    render(<ClaimForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/patient/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/procedure codes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/diagnosis codes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/attachments/i)).toBeInTheDocument()
  })

  it('populates form with initial data', () => {
    render(<ClaimForm onSubmit={mockOnSubmit} initialData={mockInitialData} />)

    expect(screen.getByLabelText(/patient/i)).toHaveValue(mockInitialData.patientId)
    expect(screen.getByLabelText(/amount/i)).toHaveValue(mockInitialData.amount)
    expect(screen.getByLabelText(/procedure codes/i)).toHaveValue(mockInitialData.procedureCodes.join(','))
    expect(screen.getByLabelText(/diagnosis codes/i)).toHaveValue(mockInitialData.diagnosisCodes.join(','))
    expect(screen.getByLabelText(/notes/i)).toHaveValue(mockInitialData.notes)
  })

  it('handles form submission with files', async () => {
    render(<ClaimForm onSubmit={mockOnSubmit} />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: 'patient-1' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: '99213' },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: 'I10' },
    })
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Test notes' },
    })

    // Upload file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/attachments/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          patientId: 'patient-1',
          amount: '100.00',
          procedureCodes: ['99213'],
          diagnosisCodes: ['I10'],
          notes: 'Test notes',
        },
        [file]
      )
    })
  })

  it('shows validation errors', async () => {
    render(<ClaimForm onSubmit={mockOnSubmit} />)

    // Submit empty form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(screen.getByText(/patient is required/i)).toBeInTheDocument()
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one procedure code is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one diagnosis code is required/i)).toBeInTheDocument()
    })
  })

  it('handles submission errors', async () => {
    const mockError = new Error('Submission failed')
    mockOnSubmit.mockRejectedValueOnce(mockError)

    render(<ClaimForm onSubmit={mockOnSubmit} />)

    // Fill out form minimally and submit
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: 'patient-1' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: '99213' },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: 'I10' },
    })

    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit claim')
    })
  })

  it('disables form during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<ClaimForm onSubmit={mockOnSubmit} isLoading={true} />)

    expect(screen.getByLabelText(/patient/i)).toBeDisabled()
    expect(screen.getByLabelText(/amount/i)).toBeDisabled()
    expect(screen.getByLabelText(/procedure codes/i)).toBeDisabled()
    expect(screen.getByLabelText(/diagnosis codes/i)).toBeDisabled()
    expect(screen.getByLabelText(/notes/i)).toBeDisabled()
    expect(screen.getByText(/submitting\.\.\./i)).toBeInTheDocument()
  })

  it('handles file validation errors', async () => {
    render(<ClaimForm onSubmit={mockOnSubmit} />)

    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
    const fileInput = screen.getByLabelText(/attachments/i)
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid file type')
    })
  })

  it('shows success toast on successful submission', async () => {
    mockOnSubmit.mockResolvedValueOnce({})
    render(<ClaimForm onSubmit={mockOnSubmit} />)

    // Fill out form
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: 'patient-1' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: '99213' },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: 'I10' },
    })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Claim submitted successfully')
    })
  })

  it('shows error toast on submission failure', async () => {
    const mockError = new Error('Submission failed')
    mockOnSubmit.mockRejectedValueOnce(mockError)

    render(<ClaimForm onSubmit={mockOnSubmit} />)

    // Fill out form minimally
    fireEvent.change(screen.getByLabelText(/patient/i), {
      target: { value: 'patient-1' },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' },
    })
    fireEvent.change(screen.getByLabelText(/procedure codes/i), {
      target: { value: '99213' },
    })
    fireEvent.change(screen.getByLabelText(/diagnosis codes/i), {
      target: { value: 'I10' },
    })

    // Submit form
    fireEvent.click(screen.getByText(/submit claim/i))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit claim. Please try again.')
    })
  })
}) 