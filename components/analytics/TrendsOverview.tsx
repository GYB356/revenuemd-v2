'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useToast } from "@/components/ui/use-toast"
import { TrendsSummary } from "./TrendsSummary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { TrendsInsights } from "@/lib/insights/trends"
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { formatCurrency, calculateGrowthRate, getGrowthColor } from '@/lib/insights/utils'

export function TrendsOverview() {
  const [data, setData] = useState<TrendsInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchTrends = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/insights/trends')
      if (!response.ok) throw new Error('Failed to fetch trends data')
      const json = await response.json()
      setData(json)
    } catch (err: any) {
      setError(err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to load trends data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6" data-testid="loading-skeleton">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-[200px]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-[150px]" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] animate-pulse bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trends Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error Loading Trends</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchTrends()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <TrendsSummary data={data} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Patient Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Patient Growth</span>
                <span className={`text-sm font-normal ${getGrowthColor(data.patientGrowth)}`}>
                  {data.patientGrowth > 0 ? '+' : ''}{data.patientGrowth.toFixed(1)}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.patientTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground text-xs" />
                    <YAxis className="text-muted-foreground text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newPatients"
                      name="New Patients"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Claims Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Claims Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.claimsTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-muted-foreground text-xs" />
                    <YAxis className="text-muted-foreground text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="claims"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenue</span>
                <span className={`text-sm font-normal ${getGrowthColor(data.revenueGrowth)}`}>
                  {data.revenueGrowth > 0 ? '+' : ''}{data.revenueGrowth.toFixed(1)}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.claimsTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" className="text-muted-foreground text-xs" />
                    <YAxis
                      className="text-muted-foreground text-xs"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}

