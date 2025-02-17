 'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { 
  Claim, 
  CreateClaimRequest, 
  ProcessClaimRequest, 
  PaginatedResponse 
} from '@/lib/types/api'
import { useAuth } from '@/lib/auth/auth-context'

interface UseClaimsOptions {
  pageSize?: number
}

export function useClaims({ pageSize = 10 }: UseClaimsOptions = {}) {
  const { user } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchClaims = useCallback(async (
    searchTerm?: string,
    statusFilter?: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/v1/claims?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch claims')
      }

      const data: PaginatedResponse<Claim[]> = await response.json()
      setClaims(data.data)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch claims'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  const createClaim = async (data: CreateClaimRequest) => {
    try {
      const response = await fetch('/api/v1/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create claim')
      }

      toast.success('Claim created successfully')
      fetchClaims()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create claim'
      toast.error(message)
      return false
    }
  }

  const processClaim = async (data: ProcessClaimRequest) => {
    try {
      const response = await fetch('/api/v1/claims/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to process claim')
      }

      toast.success(`Claim ${data.status.toLowerCase()} successfully`)
      fetchClaims()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process claim'
      toast.error(message)
      return false
    }
  }

  const deleteClaim = async (claimId: string) => {
    try {
      const response = await fetch(`/api/v1/claims/${claimId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete claim')
      }

      toast.success('Claim deleted successfully')
      fetchClaims()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete claim'
      toast.error(message)
      return false
    }
  }

  return {
    claims,
    loading,
    error,
    page,
    totalPages,
    setPage,
    fetchClaims,
    createClaim,
    processClaim,
    deleteClaim,
  }
}