// Update this file to handle the new data format from the updated metrics API
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, AlertCircle } from "lucide-react"

interface MetricsData {
  influxData: string
  prometheusData: any
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/metrics")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      setMetrics(data)
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Fetch every minute
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const handleRefresh = () => {
    fetchMetrics()
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            <h2 className="text-2xl font-bold">System Metrics</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !error && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Loading metrics...</p>
          </div>
        )}

        {metrics && !loading && !error && (
          <div className="space-y-4 mt-4">
            <div>
              <h3 className="text-xl font-semibold">InfluxDB Data</h3>
              <pre className="text-sm overflow-auto max-h-40 bg-gray-100 p-2 rounded">{metrics.influxData}</pre>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Prometheus Data</h3>
              <pre className="text-sm overflow-auto max-h-40 bg-gray-100 p-2 rounded">
                {JSON.stringify(metrics.prometheusData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

