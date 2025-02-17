import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClaimsDashboardClient } from '@/app/dashboard/claims/components/claims-dashboard-client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

// Add Jest matchers type declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveBeenCalled(): R
      toHaveBeenCalledWith(...args: any[]): R
      toBeEmptyDOMElement(): R
    }
  }
}

// Add expect.stringContaining and expect.objectContaining
declare global {
  namespace jest {
    interface Expect {
      stringContaining(str: string): any
      objectContaining(obj: object): any
      any(constructor: any): any
    }
  }
}

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ClaimsDashboardClient', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  }

  const mockClaims = [
    {
      id: 'claim-1',
      patientId: 'patient-1',
      amount: 100,
      status: 'PENDING',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      procedureCodes: ['99213'],
      diagnosisCodes: ['I10'],
    },
    {
      id: 'claim-2',
      patientId: 'patient-2',
      amount: 200,
      status: 'APPROVED',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      procedureCodes: ['99214'],
      diagnosisCodes: ['E11'],
    },
  ]

  const defaultProps = {
    claims: mockClaims,
    onFilterChange: jest.fn(),
    onSort: jest.fn(),
    onBulkStatusUpdate: jest.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
  })

  it('renders the dashboard with claims data', () => {
    render(<ClaimsDashboardClient {...defaultProps} />)

    expect(screen.getByText('Claims Dashboard')).toBeInTheDocument()
    expect(screen.getByText('New Claim')).toBeInTheDocument()

    // Check if claims are rendered
    expect(screen.getByText('patient-1')).toBeInTheDocument()
    expect(screen.getByText('patient-2')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
  })

  it('handles new claim button click', () => {
    render(<ClaimsDashboardClient {...defaultProps} />)

    fireEvent.click(screen.getByText('New Claim'))
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/claims/new')
  })

  it('handles filter changes', () => {
    const onFilterChange = jest.fn()
    render(<ClaimsDashboardClient {...defaultProps} onFilterChange={onFilterChange} />)

    // Change status filter
    fireEvent.click(screen.getByText('All Statuses'))
    fireEvent.click(screen.getByText('Pending'))

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
      })
    )
  })

  it('handles sorting', () => {
    const onSort = jest.fn()
    render(<ClaimsDashboardClient {...defaultProps} onSort={onSort} />)

    // Click amount header to sort
    fireEvent.click(screen.getByText('Amount'))

    expect(onSort).toHaveBeenCalledWith('amount')
  })

  it('handles bulk status updates', async () => {
    const onBulkStatusUpdate = jest.fn().mockResolvedValue(undefined)
    render(<ClaimsDashboardClient {...defaultProps} onBulkStatusUpdate={onBulkStatusUpdate} />)

    // Select claims
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First claim checkbox
    fireEvent.click(checkboxes[2]) // Second claim checkbox

    // Click approve button
    fireEvent.click(screen.getByText('Approve Selected (2)'))

    // Confirm bulk update
    fireEvent.click(screen.getByText('Update Claims'))

    await waitFor(() => {
      expect(onBulkStatusUpdate).toHaveBeenCalledWith(
        ['claim-1', 'claim-2'],
        'APPROVED'
      )
    })

    expect(toast.success).toHaveBeenCalled()
  })

  it('handles unauthorized access', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    
    const { container } = render(<ClaimsDashboardClient {...defaultProps} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows loading state', () => {
    render(<ClaimsDashboardClient {...defaultProps} isLoading={true} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
}) 