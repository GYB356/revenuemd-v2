import { render, screen } from '@testing-library/react'
import { ClaimsStats } from '@/app/dashboard/claims/components/claims-stats'

describe('ClaimsStats', () => {
  const mockClaims = [
    {
      id: 'claim-1',
      amount: 100,
      status: 'PENDING',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'claim-2',
      amount: 200,
      status: 'APPROVED',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'claim-3',
      amount: 300,
      status: 'DENIED',
      createdAt: '2024-01-03T00:00:00Z',
    },
    {
      id: 'claim-4',
      amount: 400,
      status: 'APPROVED',
      createdAt: '2024-01-04T00:00:00Z',
    },
  ] as const

  it('renders all stat cards', () => {
    render(<ClaimsStats claims={mockClaims} />)

    expect(screen.getByText('Total Claims')).toBeInTheDocument()
    expect(screen.getByText('Pending Claims')).toBeInTheDocument()
    expect(screen.getByText('Approved Claims')).toBeInTheDocument()
    expect(screen.getByText('Denied Claims')).toBeInTheDocument()
    expect(screen.getByText('Total Amount')).toBeInTheDocument()
    expect(screen.getByText('Approved Amount')).toBeInTheDocument()
  })

  it('displays correct claim counts', () => {
    render(<ClaimsStats claims={mockClaims} />)

    expect(screen.getByText('4')).toBeInTheDocument() // Total claims
    expect(screen.getByText('1')).toBeInTheDocument() // Pending claims
    expect(screen.getByText('2')).toBeInTheDocument() // Approved claims
    expect(screen.getByText('1')).toBeInTheDocument() // Denied claims
  })

  it('displays correct amounts', () => {
    render(<ClaimsStats claims={mockClaims} />)

    expect(screen.getByText('$1,000.00')).toBeInTheDocument() // Total amount
    expect(screen.getByText('$600.00')).toBeInTheDocument() // Approved amount
  })

  it('handles empty claims array', () => {
    render(<ClaimsStats claims={[]} />)

    expect(screen.getByText('0')).toBeInTheDocument() // Total claims
    expect(screen.getByText('$0.00')).toBeInTheDocument() // Total amount
  })

  it('applies correct color classes', () => {
    render(<ClaimsStats claims={mockClaims} />)

    expect(screen.getByText('Total Claims')).toHaveClass('bg-blue-100', 'text-blue-800')
    expect(screen.getByText('Pending Claims')).toHaveClass('bg-yellow-100', 'text-yellow-800')
    expect(screen.getByText('Approved Claims')).toHaveClass('bg-green-100', 'text-green-800')
    expect(screen.getByText('Denied Claims')).toHaveClass('bg-red-100', 'text-red-800')
    expect(screen.getByText('Total Amount')).toHaveClass('bg-purple-100', 'text-purple-800')
    expect(screen.getByText('Approved Amount')).toHaveClass('bg-emerald-100', 'text-emerald-800')
  })
}) 