import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, BarChart, PieChart } from '@/components/ui/charts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'

interface AnalyticsData {
  claims: {
    metrics: {
      totalClaims: number
      totalAmount: number
      approvalRate: number
    }
    trends: any[]
  }
  patients: {
    totalPatients: number
    newPatients: number
    demographics: {
      ageGroups: Record<string, number>
      gender: Record<string, number>
      location: Record<string, number>
    }
  }
  trends: {
    patientGrowth: number
    revenueGrowth: number
    claimsGrowth: number
    trends: any[]
  }
}

export function DashboardOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimsRes, patientsRes, trendsRes] = await Promise.all([
          fetch('/api/v1/analytics/claims'),
          fetch('/api/v1/analytics/patients'),
          fetch('/api/v1/analytics/trends')
        ])

        if (!claimsRes.ok || !patientsRes.ok || !trendsRes.ok) {
          throw new Error('Failed to fetch analytics data')
        }

        const claims = await claimsRes.json()
        const patients = await patientsRes.json()
        const trends = await trendsRes.json()

        setData({ claims, patients, trends })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load analytics data'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Claims"
          value={data.claims.metrics.totalClaims}
          trend={data.trends.claimsGrowth}
        />
        <MetricCard
          title="Total Patients"
          value={data.patients.totalPatients}
          trend={data.trends.patientGrowth}
        />
        <MetricCard
          title="Revenue"
          value={data.claims.metrics.totalAmount}
          trend={data.trends.revenueGrowth}
          valueFormatter={(val) => `$${val.toLocaleString()}`}
        />
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={data.trends.trends}
                xField="period"
                yField="value"
                height={400}
                categories={['patients', 'claims', 'revenue']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={Object.entries(data.patients.demographics.ageGroups).map(
                    ([key, value]) => ({ name: key, value })
                  )}
                  xField="name"
                  yField="value"
                  height={300}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={Object.entries(data.patients.demographics.gender).map(
                    ([key, value]) => ({ name: key, value })
                  )}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Claims Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={data.claims.trends}
                xField="period"
                yField="value"
                height={400}
                valueFormatter={(val) => `$${val.toLocaleString()}`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  trend,
  valueFormatter = (val: number) => val.toString()
}: {
  title: string
  value: number
  trend: number
  valueFormatter?: (value: number) => string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span
          className={`text-sm ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : ''
          }`}
        >
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valueFormatter(value)}</div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" data-testid="dashboard-skeleton">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
} 