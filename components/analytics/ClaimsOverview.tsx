'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ClaimsData {
  totalValue: number
  averageAmount: number
  byStatus: {
    PENDING: number
    APPROVED: number
    DENIED: number
  }
  monthlyTrends: Array<{
    month: string
    amount: number
    count: number
  }>
}

export function ClaimsOverview() {
  const [data, setData] = useState<ClaimsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadClaimsData()
  }, [])

  const loadClaimsData = async () => {
    try {
      setLoading(true)
      const [totalResponse, averageResponse] = await Promise.all([
        fetch('/api/analytics/total-claims-value'),
        fetch('/api/analytics/average-claim-amount'),
      ])

      if (!totalResponse.ok || !averageResponse.ok) {
        throw new Error('Failed to fetch claims data')
      }

      const [totalData, averageData] = await Promise.all([
        totalResponse.json(),
        averageResponse.json(),
      ])

      // For now, using mock data for status distribution and trends
      // TODO: Replace with actual API endpoints
      const mockData: ClaimsData = {
        totalValue: totalData.value,
        averageAmount: averageData.value,
        byStatus: {
          PENDING: 15,
          APPROVED: 45,
          DENIED: 10,
        },
        monthlyTrends: [
          { month: 'Jan', amount: 50000, count: 20 },
          { month: 'Feb', amount: 65000, count: 25 },
          { month: 'Mar', amount: 55000, count: 22 },
          { month: 'Apr', amount: 70000, count: 28 },
          { month: 'May', amount: 85000, count: 32 },
          { month: 'Jun', amount: 95000, count: 38 },
        ],
      }

      setData(mockData)
    } catch (error) {
      console.error('Failed to load claims data:', error)
      toast({
        title: "Error",
        description: "Failed to load claims data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading claims data...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const COLORS = ['#FF9800', '#4CAF50', '#f44336']
  const statusData = [
    { name: 'Pending', value: data.byStatus.PENDING },
    { name: 'Approved', value: data.byStatus.APPROVED },
    { name: 'Denied', value: data.byStatus.DENIED },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Claims Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Average Claim Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.averageAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(data.byStatus).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Claims Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="#4CAF50"
                    name="Amount"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#2196F3"
                    name="Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 