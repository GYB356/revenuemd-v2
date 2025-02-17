'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Claim } from '@/lib/api'

interface StatCardProps {
  label: string
  value: string | number
  variant: 'default' | 'success' | 'warning' | 'info'
  className?: string
}

function StatCard({ label, value, variant, className }: StatCardProps): JSX.Element {
  return (
    <Card className={className}>
      <div className="p-6 flex flex-col items-center justify-center space-y-2">
        <Badge variant={variant}>{label}</Badge>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </Card>
  )
}

interface ClaimsStatsProps {
  claims: Claim[]
}

export function ClaimsStats({ claims }: ClaimsStatsProps): JSX.Element {
  const stats = useMemo(() => {
    const totalClaims = claims.length
    const pendingClaims = claims.filter(c => c.status === 'PENDING').length
    const approvedClaims = claims.filter(c => c.status === 'APPROVED').length
    const deniedClaims = claims.filter(c => c.status === 'DENIED').length

    const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0)
    const approvedAmount = claims
      .filter(c => c.status === 'APPROVED')
      .reduce((sum, claim) => sum + claim.amount, 0)

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }

    return [
      {
        label: 'Total Claims',
        value: totalClaims,
        variant: 'default' as const,
      },
      {
        label: 'Pending Claims',
        value: pendingClaims,
        variant: 'warning' as const,
      },
      {
        label: 'Approved Claims',
        value: approvedClaims,
        variant: 'success' as const,
      },
      {
        label: 'Denied Claims',
        value: deniedClaims,
        variant: 'info' as const,
      },
      {
        label: 'Total Amount',
        value: formatCurrency(totalAmount),
        variant: 'default' as const,
      },
      {
        label: 'Approved Amount',
        value: formatCurrency(approvedAmount),
        variant: 'success' as const,
      },
    ]
  }, [claims])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
} 