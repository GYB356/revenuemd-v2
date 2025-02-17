import { render, screen } from '@testing-library/react'
import { LineChart, BarChart, PieChart } from '@/components/ui/charts'

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

describe('Chart Components', () => {
  const mockData = [
    { date: '2024-01', value: 100 },
    { date: '2024-02', value: 200 },
  ]

  describe('LineChart', () => {
    it('renders with basic data', () => {
      render(
        <LineChart
          data={mockData}
          xField="date"
          yField="value"
        />
      )
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
      const { container } = render(
        <LineChart
          data={mockData}
          xField="date"
          yField="value"
          height={400}
        />
      )
      expect(container.firstChild).toHaveStyle({ height: '400px' })
    })

    it('renders with value formatter', () => {
      const formatter = (value: number) => `$${value}`
      render(
        <LineChart
          data={mockData}
          xField="date"
          yField="value"
          valueFormatter={formatter}
        />
      )
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('renders with multiple categories', () => {
      render(
        <LineChart
          data={mockData}
          xField="date"
          yField="value"
          categories={['category1', 'category2']}
        />
      )
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('BarChart', () => {
    it('renders with basic data', () => {
      render(
        <BarChart
          data={mockData}
          xField="date"
          yField="value"
        />
      )
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
      const { container } = render(
        <BarChart
          data={mockData}
          xField="date"
          yField="value"
          height={400}
        />
      )
      expect(container.firstChild).toHaveStyle({ height: '400px' })
    })

    it('renders with value formatter', () => {
      const formatter = (value: number) => `$${value}`
      render(
        <BarChart
          data={mockData}
          xField="date"
          yField="value"
          valueFormatter={formatter}
        />
      )
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('renders with multiple categories', () => {
      render(
        <BarChart
          data={mockData}
          xField="date"
          yField="value"
          categories={['category1', 'category2']}
        />
      )
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('PieChart', () => {
    const pieData = [
      { name: 'Group A', value: 400 },
      { name: 'Group B', value: 300 },
    ]

    it('renders with basic data', () => {
      render(
        <PieChart data={pieData} />
      )
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
      const { container } = render(
        <PieChart
          data={pieData}
          height={400}
        />
      )
      expect(container.firstChild).toHaveStyle({ height: '400px' })
    })

    it('renders with value formatter', () => {
      const formatter = (value: number) => `$${value}`
      render(
        <PieChart
          data={pieData}
          valueFormatter={formatter}
        />
      )
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })
}) 