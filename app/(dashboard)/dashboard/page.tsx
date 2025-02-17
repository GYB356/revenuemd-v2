'use client'

import { useState } from 'react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { AdvancedChart } from '@/components/charts/advanced-chart'
import { Icons } from '@/components/ui/icons'
import { useChartData } from '@/lib/hooks/use-chart-data'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

const stats = [
  {
    name: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive' as const,
    icon: Icons.revenue,
  },
  {
    name: 'Active Patients',
    value: '2,350',
    change: '+180',
    changeType: 'positive' as const,
    icon: Icons.patients,
  },
  {
    name: 'Pending Claims',
    value: '156',
    change: '-8%',
    changeType: 'negative' as const,
    icon: Icons.billing,
  },
  {
    name: 'Success Rate',
    value: '94.2%',
    change: '+2.5%',
    changeType: 'positive' as const,
    icon: Icons.analytics,
  },
]

const timeRanges = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d')
  
  const { 
    data: revenueData, 
    isLoading: revenueLoading, 
    error: revenueError 
  } = useChartData({
    endpoint: `/api/charts/revenue?range=${timeRange}`,
    interval: 60000, // Refresh every minute
  })

  const { 
    data: claimsData, 
    isLoading: claimsLoading, 
    error: claimsError 
  } = useChartData({
    endpoint: `/api/charts/claims?range=${timeRange}`,
    interval: 60000,
  })

  const { 
    data: patientData, 
    isLoading: patientLoading, 
    error: patientError 
  } = useChartData({
    endpoint: `/api/charts/patients?range=${timeRange}`,
    interval: 60000,
  })

  const { 
    data: treatmentData, 
    isLoading: treatmentLoading, 
    error: treatmentError 
  } = useChartData({
    endpoint: `/api/charts/treatments?range=${timeRange}`,
    interval: 60000,
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your practice overview and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <AdvancedChart
            title="Revenue Trend"
            type="area"
            data={revenueData}
            dataKey="value"
            categories={['Revenue']}
            isRealTime
            websocketUrl="wss://api.revenuemd.com/ws/charts/revenue"
            height={300}
            showControls
            isLoading={revenueLoading}
            error={revenueError}
          />
        </motion.div>
        
        <motion.div
          className="col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <AdvancedChart
            title="Claims Distribution"
            type="pie"
            data={claimsData}
            dataKey="value"
            isRealTime
            websocketUrl="wss://api.revenuemd.com/ws/charts/claims"
            height={300}
            showControls
            isLoading={claimsLoading}
            error={claimsError}
          />
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <AdvancedChart
            title="Patient Demographics"
            type="bar"
            data={patientData}
            dataKey="value"
            categories={['New', 'Active', 'Returning']}
            isRealTime
            websocketUrl="wss://api.revenuemd.com/ws/charts/patients"
            height={300}
            showControls
            isLoading={patientLoading}
            error={patientError}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <AdvancedChart
            title="Treatment Success Rate"
            type="line"
            data={treatmentData}
            dataKey="value"
            categories={['Success', 'Partial', 'Failed']}
            isRealTime
            websocketUrl="wss://api.revenuemd.com/ws/charts/treatments"
            height={300}
            showControls
            isLoading={treatmentLoading}
            error={treatmentError}
          />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="rounded-lg border bg-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent Activity</h3>
          <Button variant="ghost" size="sm">
            View All
            <Icons.arrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <div className="space-y-4">
            {[
              {
                icon: Icons.user,
                title: 'New patient registered',
                description: 'John Doe - General Checkup',
                time: '2 hours ago',
              },
              {
                icon: Icons.billing,
                title: 'Payment received',
                description: 'Insurance claim #1234 - $450.00',
                time: '3 hours ago',
              },
              {
                icon: Icons.calendar,
                title: 'Appointment scheduled',
                description: 'Sarah Smith - Follow-up',
                time: '5 hours ago',
              },
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 rounded-lg border p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10">
                  <activity.icon className="h-8 w-8 p-2 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}