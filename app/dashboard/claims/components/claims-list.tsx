 'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Claim } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClaimsListProps {
  claims: Claim[]
  onSort: (key: keyof Claim) => void
  sortConfig: {
    key: keyof Claim
    direction: 'asc' | 'desc'
  }
  onBulkStatusUpdate: (claimIds: string[], newStatus: 'APPROVED' | 'DENIED') => Promise<void>
  onRefresh: () => void
}

export function ClaimsList({
  claims,
  onSort,
  sortConfig,
  onBulkStatusUpdate,
  onRefresh,
}: ClaimsListProps) {
  const router = useRouter()
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSort = (key: keyof Claim) => {
    onSort(key)
  }

  const getSortIcon = (key: keyof Claim) => {
    if (sortConfig.key === key) {
      return (
        <ArrowUpDown className={`ml-2 h-4 w-4 ${
          sortConfig.direction === 'asc' ? 'transform rotate-180' : ''
        }`} />
      )
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(new Set(claims.map(claim => claim.id)))
    } else {
      setSelectedClaims(new Set())
    }
  }

  const handleSelectClaim = (claimId: string, checked: boolean) => {
    const newSelected = new Set(selectedClaims)
    if (checked) {
      newSelected.add(claimId)
    } else {
      newSelected.delete(claimId)
    }
    setSelectedClaims(newSelected)
  }

  const handleBulkUpdate = async (status: 'APPROVED' | 'DENIED') => {
    if (selectedClaims.size === 0) return

    try {
      setIsUpdating(true)
      await onBulkStatusUpdate(Array.from(selectedClaims), status)
      setSelectedClaims(new Set())
      onRefresh()
    } catch (error) {
      console.error('Failed to update claims:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'DENIED':
        return 'destructive'
      default:
        return 'warning'
    }
  }

  return (
    <div className="space-y-4">
      {selectedClaims.size > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
          <p className="text-sm">
            {selectedClaims.size} {selectedClaims.size === 1 ? 'claim' : 'claims'} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleBulkUpdate('APPROVED')}
              disabled={isUpdating}
            >
              Approve Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkUpdate('DENIED')}
              disabled={isUpdating}
            >
              Deny Selected
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedClaims.size === claims.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer group"
                onClick={() => handleSort('patientId')}
              >
                Patient
                {getSortIcon('patientId')}
              </TableHead>
              <TableHead
                className="cursor-pointer group"
                onClick={() => handleSort('amount')}
              >
                Amount
                {getSortIcon('amount')}
              </TableHead>
              <TableHead
                className="cursor-pointer group"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIcon('status')}
              </TableHead>
              <TableHead
                className="cursor-pointer group"
                onClick={() => handleSort('createdAt')}
              >
                Created
                {getSortIcon('createdAt')}
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedClaims.has(claim.id)}
                    onCheckedChange={(checked) => handleSelectClaim(claim.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{claim.patient?.name}</p>
                    <p className="text-sm text-muted-foreground">{claim.patientId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(claim.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(claim.status)}>
                    {claim.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(claim.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/claims/${claim.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      {claim.status === 'PENDING' && (
                        <>
                          <DropdownMenuItem onClick={() => handleBulkUpdate('APPROVED')}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkUpdate('DENIED')}>
                            Deny
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}