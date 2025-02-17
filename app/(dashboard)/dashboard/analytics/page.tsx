import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { ChartCard } from '@/components/dashboard/chart-card'

const metrics = [
  {
    name: 'Total Revenue',
    value: '$125,430',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Icons.revenue,
  },
  {
    name: 'Claims Success Rate',
    value: '94.2%',
    change: '+1.2%',
    changeType: 'positive' as const,
    icon: Icons.analytics,
  },
  {
    name: 'Average Processing Time',
    value: '3.2 days',
    change: '-0.5 days',
    changeType: 'positive' as const,
    icon: Icons.clock,
  },
  {
    name: 'Denied Claims',
    value: '5.8%',
    change: '+0.8%',
    changeType: 'negative' as const,
    icon: Icons.alertTriangle,
  },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            View detailed insights and reports
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Icons.calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline">
            <Icons.download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.name}
              className="rounded-lg border bg-card p-6 text-card-foreground"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{metric.name}</h3>
                </div>
                <span
                  className={`text-sm ${
                    metric.changeType === 'positive'
                      ? 'text-success'
                      : 'text-destructive'
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">{metric.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6">
        <ChartCard title="Revenue Trends">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Revenue chart placeholder
          </div>
        </ChartCard>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Claims by Status">
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Claims status chart placeholder
            </div>
          </ChartCard>
          <ChartCard title="Top Procedures">
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Procedures chart placeholder
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Insights Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold">Key Insights</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <Icons.trendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <h4 className="font-medium">Revenue Growth</h4>
              <p className="text-sm text-muted-foreground">
                Revenue has increased by 12.5% compared to last month, driven by higher patient volume and improved claims processing.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <Icons.alertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h4 className="font-medium">Claims Processing</h4>
              <p className="text-sm text-muted-foreground">
                There's a slight increase in denied claims. Consider reviewing documentation requirements with staff.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <Icons.check className="h-5 w-5 text-success" />
            </div>
            <div>
              <h4 className="font-medium">Efficiency Improvement</h4>
              <p className="text-sm text-muted-foreground">
                Average claim processing time has decreased by 0.5 days due to automated verification processes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 