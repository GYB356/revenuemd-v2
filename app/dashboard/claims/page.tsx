import { Suspense } from "react"
import { ClaimsDashboardClient } from "./components/claims-dashboard-client"
import { getClaims, type Claim } from "@/lib/api"

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { data: claims, pagination } = await getClaims({
    page: Number(searchParams.page) || 1,
    limit: Number(searchParams.limit) || 10,
    status: searchParams.status?.toString(),
    patientId: searchParams.patientId?.toString(),
    sortBy: searchParams.sortBy as keyof Claim,
    sortDirection: searchParams.sortDirection as 'asc' | 'desc',
    dateRange: searchParams.dateRange?.toString(),
    minAmount: searchParams.minAmount?.toString(),
    maxAmount: searchParams.maxAmount?.toString(),
    searchTerm: searchParams.searchTerm?.toString(),
  })

  const currentFilters = {
    status: searchParams.status?.toString(),
    dateRange: searchParams.dateRange ? {
      from: new Date(searchParams.dateRange.toString().split(',')[0]),
      to: new Date(searchParams.dateRange.toString().split(',')[1]),
    } : undefined,
    minAmount: searchParams.minAmount ? Number(searchParams.minAmount) : undefined,
    maxAmount: searchParams.maxAmount ? Number(searchParams.maxAmount) : undefined,
    searchTerm: searchParams.searchTerm?.toString(),
  }

  return (
    <Suspense fallback={<div className="p-4">Loading claims...</div>}>
      <ClaimsDashboardClient
        claims={claims}
        onFilterChange={(filters) => {
          const url = new URL(window.location.href)
          const params = new URLSearchParams(url.search)

          // Update filter params
          if (filters.status) {
            params.set('status', filters.status)
          } else {
            params.delete('status')
          }

          if (filters.dateRange) {
            params.set('dateRange', `${filters.dateRange.from.toISOString()},${filters.dateRange.to.toISOString()}`)
          } else {
            params.delete('dateRange')
          }

          if (filters.minAmount) {
            params.set('minAmount', filters.minAmount.toString())
          } else {
            params.delete('minAmount')
          }

          if (filters.maxAmount) {
            params.set('maxAmount', filters.maxAmount.toString())
          } else {
            params.delete('maxAmount')
          }

          if (filters.searchTerm) {
            params.set('searchTerm', filters.searchTerm)
          } else {
            params.delete('searchTerm')
          }

          // Reset pagination when filters change
          params.set('page', '1')

          window.history.pushState({}, '', `?${params.toString()}`)
        }}
        onSort={(key) => {
          const url = new URL(window.location.href)
          const params = new URLSearchParams(url.search)
          const currentSortBy = params.get('sortBy')
          const currentDirection = params.get('sortDirection')

          if (currentSortBy === key) {
            // Toggle direction if same key
            params.set('sortDirection', currentDirection === 'asc' ? 'desc' : 'asc')
          } else {
            // Set new sort key and default to ascending
            params.set('sortBy', key)
            params.set('sortDirection', 'asc')
          }

          window.history.pushState({}, '', `?${params.toString()}`)
        }}
        onBulkStatusUpdate={async (claimIds, newStatus) => {
          'use server'
          const response = await fetch('/api/claims/bulk', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ claimIds, status: newStatus }),
          })

          if (!response.ok) {
            throw new Error('Failed to update claims')
          }
        }}
        isLoading={false}
        currentFilters={currentFilters}
        sortConfig={{
          key: (searchParams.sortBy as keyof Claim) || 'createdAt',
          direction: (searchParams.sortDirection as 'asc' | 'desc') || 'desc',
        }}
      />
    </Suspense>
  )
} 