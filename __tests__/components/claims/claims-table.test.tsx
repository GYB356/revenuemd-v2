import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClaimsTable } from '@/components/claims/claims-table'
import { useClaims } from '@/lib/hooks/use-claims'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('@/lib/hooks/use-claims')
jest.mock('sonner')

const mockClaims = [
  {
    id: '1',
    patientName: 'John Doe',
    amount: 500,
    status: 'PENDING',
    submittedDate: '2024-03-01',
    insuranceProvider: 'Blue Cross',
    procedureCodes: ['99213'],
    diagnosisCodes: ['E11.9'],
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    amount: 750,
    status: 'APPROVED',
    submittedDate: '2024-03-02',
    insuranceProvider: 'Aetna',
    procedureCodes: ['99214'],
    diagnosisCodes: ['I10'],
  },
]

describe('ClaimsTable', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default mock implementation
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      fetchClaims: jest.fn(),
      processClaim: jest.fn(),
    })
  })

  it('renders claims table with data', () => {
    render(<ClaimsTable />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('$500.00')).toBeInTheDocument()
    expect(screen.getByText('$750.00')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: [],
      loading: true,
      error: null,
      page: 1,
      totalPages: 1,
    })

    render(<ClaimsTable />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error state', () => {
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: [],
      loading: false,
      error: 'Failed to fetch claims',
      page: 1,
      totalPages: 1,
    })

    render(<ClaimsTable />)
    
    expect(screen.getByText('Failed to fetch claims')).toBeInTheDocument()
  })

  it('handles claim approval', async () => {
    const processClaim = jest.fn().mockResolvedValue(true)
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      processClaim,
    })

    render(<ClaimsTable />)
    
    const approveButton = screen.getAllByRole('button', { name: /approve/i })[0]
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(processClaim).toHaveBeenCalledWith({
        claimId: '1',
        status: 'APPROVED',
      })
      expect(toast.success).toHaveBeenCalledWith('Claim approved successfully')
    })
  })

  it('handles claim denial', async () => {
    const processClaim = jest.fn().mockResolvedValue(true)
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      processClaim,
    })

    render(<ClaimsTable />)
    
    const denyButton = screen.getAllByRole('button', { name: /deny/i })[0]
    fireEvent.click(denyButton)

    await waitFor(() => {
      expect(processClaim).toHaveBeenCalledWith({
        claimId: '1',
        status: 'DENIED',
      })
      expect(toast.success).toHaveBeenCalledWith('Claim denied successfully')
    })
  })

  it('handles pagination', () => {
    const setPage = jest.fn()
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 3,
      setPage,
    })

    render(<ClaimsTable />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    expect(setPage).toHaveBeenCalledWith(2)
  })

  it('filters claims by status', async () => {
    const fetchClaims = jest.fn()
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      fetchClaims,
    })

    render(<ClaimsTable />)
    
    const statusFilter = screen.getByRole('combobox')
    fireEvent.change(statusFilter, { target: { value: 'APPROVED' } })

    await waitFor(() => {
      expect(fetchClaims).toHaveBeenCalledWith(expect.any(String), 'APPROVED')
    })
  })

  it('searches claims', async () => {
    const fetchClaims = jest.fn()
    ;(useClaims as jest.Mock).mockReturnValue({
      claims: mockClaims,
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      fetchClaims,
    })

    render(<ClaimsTable />)
    
    const searchInput = screen.getByPlaceholderText(/search claims/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })

    await waitFor(() => {
      expect(fetchClaims).toHaveBeenCalledWith('John', expect.any(String))
    })
  })
})