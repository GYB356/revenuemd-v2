import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  name: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: LucideIcon
}

export function StatsCard({ name, value, change, changeType, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="tracking-tight text-sm font-medium">{name}</h3>
        </div>
        <span
          className={`text-sm ${
            changeType === 'positive' ? 'text-success' : 'text-destructive'
          }`}
        >
          {change}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}