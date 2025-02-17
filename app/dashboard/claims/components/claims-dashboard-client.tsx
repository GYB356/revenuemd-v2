'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClaimsFilter, FilterState } from './claims-filter'
import { ClaimsTable } from './claims-table'
import { ClaimsStats } from './claims-stats'
import { toast } from 'sonner'
import { Claim } from '@/lib/api'
import { Plus } from 'lucide-react'

interface ClaimsDashboardClientProps {
  claims: Claim[]
  onFilterChange: (filters: FilterState) => void
  onSort: (key: keyof Claim) => void
  onBulkStatusUpdate: (claimIds: string[], newStatus: 'APPROVED' | 'DENIED') => Promise<void>
  isLoading: boolean
  currentFilters: FilterState
  sortConfig: {
    key: keyof Claim
    direction: 'asc' | 'desc'
  }
}

export function ClaimsDashboardClient({
  claims,
  onFilterChange,
  onSort,
  onBulkStatusUpdate,
  isLoading,
  currentFilters,
  sortConfig,
}: ClaimsDashboardClientProps): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect((): void => {
    const params = new URLSearchParams(searchParams)
    const filters: FilterState = {}

    if (params.has('searchTerm')) {
      filters.searchTerm = params.get('searchTerm') || undefined
    }
    if (params.has('status')) {
      filters.status = params.get('status') as Claim['status']
    }
    if (params.has('minAmount')) {
      filters.minAmount = parseFloat(params.get('minAmount') || '')
    }
    if (params.has('maxAmount')) {
      filters.maxAmount = parseFloat(params.get('maxAmount') || '')
    }
    if (params.has('dateFrom') && params.has('dateTo')) {
      filters.dateRange = {
        from: new Date(params.get('dateFrom') || ''),
        to: new Date(params.get('dateTo') || ''),
      }
    }

    onFilterChange(filters)
  }, [searchParams, onFilterChange])

  const handleRefresh = (): void => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateClaim = (): void => {
    router.push('/dashboard/claims/new')
  }

  const handleBulkStatusUpdate = async (
    claimIds: string[],
    newStatus: 'APPROVED' | 'DENIED'
  ): Promise<void> => {
    try {
      await onBulkStatusUpdate(claimIds, newStatus)
      toast.success(`Successfully ${newStatus.toLowerCase()} ${claimIds.length} claims`)
      handleRefresh()
    } catch (error) {
      toast.error('Failed to update claims')
      console.error('Failed to update claims:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Claims Dashboard</h1>
        <Button onClick={handleCreateClaim}>
          <Plus className="mr-2 h-4 w-4" />
          Create Claim
        </Button>
      </div>

      <div className="space-y-6">
        <ClaimsStats claims={claims} />

        <Card>
          <CardHeader>
            <CardTitle>Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimsFilter
              currentFilters={currentFilters}
              onFilterChange={onFilterChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4" role="status">Loading claims...</div>
            ) : (
              <ClaimsTable
                claims={claims}
                onSort={onSort}
                sortConfig={sortConfig}
                onBulkStatusUpdate={handleBulkStatusUpdate}
                onRefresh={handleRefresh}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 