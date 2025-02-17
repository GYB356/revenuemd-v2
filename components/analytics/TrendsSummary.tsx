'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import type { TrendsInsights } from "@/lib/insights/trends"

interface TrendsSummaryProps {
  data: TrendsInsights
}

export function TrendsSummary({ data }: TrendsSummaryProps) {
  // Calculate month-over-month growth rates
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getLastTwoMonths = (trends: any[]) => {
    return [trends[trends.length - 1], trends[trends.length - 2]]
  }

  // Patient growth
  const [currentPatient, previousPatient] = getLastTwoMonths(data.patientTrends)
  const patientGrowth = calculateGrowthRate(
    currentPatient.newPatients,
    previousPatient.newPatients
  )

  // Claims growth
  const [currentClaims, previousClaims] = getLastTwoMonths(data.claimsTrends)
  const claimsGrowth = calculateGrowthRate(
    currentClaims.totalClaims,
    previousClaims.totalClaims
  )

  // Revenue growth
  const [currentRevenue, previousRevenue] = getLastTwoMonths(data.revenueTrends)
  const revenueGrowth = calculateGrowthRate(
    currentRevenue.totalRevenue,
    previousRevenue.totalRevenue
  )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Patient Growth
          </CardTitle>
          <div className={`flex items-center text-sm ${patientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {patientGrowth >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {Math.abs(patientGrowth).toFixed(1)}%
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentPatient.newPatients}</div>
          <p className="text-xs text-muted-foreground">
            New patients this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Claims Volume
          </CardTitle>
          <div className={`flex items-center text-sm ${claimsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {claimsGrowth >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {Math.abs(claimsGrowth).toFixed(1)}%
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentClaims.totalClaims}</div>
          <p className="text-xs text-muted-foreground">
            Total claims this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Revenue Growth
          </CardTitle>
          <div className={`flex items-center text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {revenueGrowth >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
            {Math.abs(revenueGrowth).toFixed(1)}%
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${currentRevenue.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total revenue this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
