import { useState, useEffect } from 'react'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface UseChartDataOptions {
  endpoint: string
  interval?: number // in milliseconds
}

export function useChartData({ endpoint, interval }: UseChartDataOptions) {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    try {
      setError(null)
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (interval) {
      const timer = setInterval(fetchData, interval)
      return () => clearInterval(timer)
    }
  }, [endpoint, interval])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  }
}