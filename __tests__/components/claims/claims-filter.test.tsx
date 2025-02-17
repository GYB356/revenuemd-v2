import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClaimsFilter } from '@/app/dashboard/claims/components/claims-filter'

describe('ClaimsFilter', () => {
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all filter inputs', () => {
    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Amount Range')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('handles status filter change', async () => {
    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByText('All Statuses'))
    fireEvent.click(screen.getByText('Pending'))

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
        })
      )
    })
  })

  it('handles date range filter change', async () => {
    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByText('Pick a date range'))
    
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    // Select dates from calendar
    fireEvent.click(screen.getByRole('button', { name: today.getDate().toString() }))
    fireEvent.click(screen.getByRole('button', { name: nextWeek.getDate().toString() }))

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.any(Object),
        })
      )
    })
  })

  it('handles amount range filter change', async () => {
    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    const minInput = screen.getByPlaceholderText('Min')
    const maxInput = screen.getByPlaceholderText('Max')

    fireEvent.change(minInput, { target: { value: '100' } })
    fireEvent.change(maxInput, { target: { value: '1000' } })

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          minAmount: 100,
          maxAmount: 1000,
        })
      )
    })
  })

  it('handles search term filter change', async () => {
    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search claims...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'test search',
        })
      )
    })
  })

  it('clears all filters', async () => {
    render(
      <ClaimsFilter
        filters={{
          status: 'PENDING',
          minAmount: 100,
          maxAmount: 1000,
          searchTerm: 'test',
        }}
        onFilterChange={mockOnFilterChange}
      />
    )

    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({})
    })
  })

  it('debounces filter changes', async () => {
    jest.useFakeTimers()

    render(
      <ClaimsFilter
        filters={{}}
        onFilterChange={mockOnFilterChange}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search claims...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Fast-forward timers
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'test',
        })
      )
    })

    jest.useRealTimers()
  })
}) 