import { ReactNode } from 'react'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { WebSocketClient } from '@/lib/websocket'

const defaultColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

type ChartType = 'line' | 'bar' | 'pie' | 'area'

interface AdvancedChartProps {
  title: string
  type: ChartType
  data: any[]
  dataKey: string
  categories?: string[]
  colors?: string[]
  isRealTime?: boolean
  websocketUrl?: string
  className?: string
  height?: number
  showControls?: boolean
  onTypeChange?: (type: ChartType) => void
}

export function AdvancedChart({
  title,
  type: initialType,
  data: initialData,
  dataKey,
  categories,
  colors = defaultColors,
  isRealTime = false,
  websocketUrl,
  className,
  height = 300,
  showControls = false,
  onTypeChange,
}: AdvancedChartProps) {
  const [chartType, setChartType] = useState<ChartType>(initialType)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isRealTime && websocketUrl) {
      const ws = new WebSocketClient(websocketUrl, {
        onMessage: (message) => {
          if (message.type === 'update') {
            setData(message.payload)
          }
        },
        onError: () => {
          setError('Failed to connect to real-time updates')
        },
      })

      return () => {
        ws.disconnect()
      }
    }
  }, [isRealTime, websocketUrl])

  const handleTypeChange = (newType: ChartType) => {
    setChartType(newType)
    onTypeChange?.(newType)
  }

  const renderChart = (): JSX.Element => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {categories ? (
              categories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
              />
            )}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {categories ? (
              categories.map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  fill={colors[index % colors.length]}
                />
              ))
            ) : (
              <Bar dataKey={dataKey} fill={colors[0]} />
            )}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {categories ? (
              categories.map((category, index) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  fillOpacity={0.3}
                  stackId="1"
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey={dataKey}
                fill={colors[0]}
                stroke={colors[0]}
                fillOpacity={0.3}
              />
            )}
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={colors[0]}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )

      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} />
          </LineChart>
        )
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {showControls && (
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleTypeChange('line')}
            >
              <Icons.lineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleTypeChange('bar')}
            >
              <Icons.barChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleTypeChange('area')}
            >
              <Icons.areaChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="icon"
              onClick={() => handleTypeChange('pie')}
            >
              <Icons.pieChart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <Icons.alertTriangle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}