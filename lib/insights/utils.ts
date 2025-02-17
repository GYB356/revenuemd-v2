export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getLastTwoMonths<T>(trends: T[]): [T, T] {
  return [trends[trends.length - 1], trends[trends.length - 2]]
}

export function formatPercentage(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`
}

export function getGrowthColor(value: number): string {
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

export function generateMonthlyDataPoints(startDate: Date, endDate: Date): string[] {
  const dataPoints: string[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dataPoints.push(currentDate.toISOString().substring(0, 7)) // YYYY-MM format
    currentDate.setMonth(currentDate.getMonth() + 1)
  }
  
  return dataPoints
}

export function calculateAverages(values: number[]): {
  mean: number
  median: number
} {
  if (values.length === 0) return { mean: 0, median: 0 }
  
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
    
  return { mean, median }
} 