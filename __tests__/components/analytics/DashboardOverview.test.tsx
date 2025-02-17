import { render, screen, waitFor } from '@testing-library/react'
import { DashboardOverview } from '@/components/analytics/DashboardOverview'

// Mock fetch
global.fetch = jest.fn()

describe('DashboardOverview', () => {
  const mockData = {
    claims: {
      metrics: {
        totalClaims: 100,
        totalAmount: 50000,
        approvalRate: 0.85
      },
      trends: []
    },
    patients: {
      totalPatients: 500,
      newPatients: 50,
      demographics: {
        ageGroups: { '0-18': 100, '19-30': 150, '31-50': 200, '51+': 50 },
        gender: { MALE: 250, FEMALE: 250 },
        location: { CA: 200, NY: 150, TX: 150 }
      }
    },
    trends: {
      patientGrowth: 15,
      revenueGrowth: 25,
      claimsGrowth: 10,
      trends: []
    }
  }

  beforeEach(() => {
    // @ts-ignore
    fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () => {
          if (url.includes('/claims')) return Promise.resolve(mockData.claims)
          if (url.includes('/patients')) return Promise.resolve(mockData.patients)
          if (url.includes('/trends')) return Promise.resolve(mockData.trends)
          return Promise.reject(new Error('Not found'))
        }
      })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<DashboardOverview />)
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('renders data after successful fetch', async () => {
    render(<DashboardOverview />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Claims')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Total Patients')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })
  })

  it('renders error state on fetch failure', async () => {
    // @ts-ignore
    fetch.mockImplementation(() => Promise.reject(new Error('Network error')))
    
    render(<DashboardOverview />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('formats currency values correctly', async () => {
    render(<DashboardOverview />)
    
    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument()
    })
  })

  it('displays growth trends with correct indicators', async () => {
    render(<DashboardOverview />)
    
    await waitFor(() => {
      expect(screen.getByText('↑ 15%')).toBeInTheDocument() // Patient growth
      expect(screen.getByText('↑ 25%')).toBeInTheDocument() // Revenue growth
      expect(screen.getByText('↑ 10%')).toBeInTheDocument() // Claims growth
    })
  })

  it('handles empty data gracefully', async () => {
    const emptyData = {
      claims: {
        metrics: { totalClaims: 0, totalAmount: 0, approvalRate: 0 },
        trends: []
      },
      patients: {
        totalPatients: 0,
        newPatients: 0,
        demographics: {
          ageGroups: {},
          gender: {},
          location: {}
        }
      },
      trends: {
        patientGrowth: 0,
        revenueGrowth: 0,
        claimsGrowth: 0,
        trends: []
      }
    }

    // @ts-ignore
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptyData)
      })
    )

    render(<DashboardOverview />)
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })
}) 