import { ReactNode } from 'react'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer } from 'recharts'

interface ChartCardProps {
  title: string
  children: ReactNode
  isLoading?: boolean
  error?: string | null
}

export function ChartCard({ 
  title, 
  children, 
  isLoading = false, 
  error = null 
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}