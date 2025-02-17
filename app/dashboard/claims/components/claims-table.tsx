'use client'

import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ArrowUpDown, RefreshCcw } from 'lucide-react'
import { Claim } from '@/lib/api'

interface ClaimsTableProps {
  claims: Claim[]
  onSort: (key: keyof Claim) => void
  sortConfig: {
    key: keyof Claim
    direction: 'asc' | 'desc'
  }
  onBulkStatusUpdate: (claimIds: string[], newStatus: 'APPROVED' | 'DENIED') => Promise<void>
  onRefresh: () => void
}

export function ClaimsTable({
  claims,
  onSort,
  sortConfig,
  onBulkStatusUpdate,
  onRefresh,
}: ClaimsTableProps) {
  const [selectedClaims, setSelectedClaims] = useState<string[]>([])
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState<boolean>(false)
  const [pendingStatus, setPendingStatus] = useState<'APPROVED' | 'DENIED' | null>(null)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const handleSort = (key: keyof Claim): void => {
    onSort(key)
  }

  const getSortIcon = (key: keyof Claim): JSX.Element => {
    if (sortConfig.key === key) {
      return (
        <ArrowUpDown className={`ml-2 h-4 w-4 ${
          sortConfig.direction === 'asc' ? 'transform rotate-180' : ''
        }`} />
      )
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
  }

  const handleSelectAll = (checked: boolean): void => {
    setSelectedClaims(checked ? claims.map(claim => claim.id) : [])
  }

  const handleSelectClaim = (claimId: string, checked: boolean): void => {
    setSelectedClaims(prev =>
      checked
        ? [...prev, claimId]
        : prev.filter(id => id !== claimId)
    )
  }

  const handleBulkUpdate = async (): Promise<void> => {
    if (!pendingStatus || selectedClaims.length === 0) return

    try {
      setIsUpdating(true)
      await onBulkStatusUpdate(selectedClaims, pendingStatus)
      setSelectedClaims([])
      setIsUpdateDialogOpen(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to update claims:', error)
    } finally {
      setIsUpdating(false)
      setPendingStatus(null)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: Claim['status']): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'DENIED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedClaims.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={(): void => {
                    setPendingStatus('APPROVED')
                    setIsUpdateDialogOpen(true)
                  }}
                >
                  Approve Selected ({selectedClaims.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={(): void => {
                    setPendingStatus('DENIED')
                    setIsUpdateDialogOpen(true)
                  }}
                >
                  Deny Selected ({selectedClaims.length})
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={onRefresh}
            className="ml-auto"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedClaims.length === claims.length}
                onCheckedChange={(checked: boolean | 'indeterminate'): void => {
                  if (typeof checked === 'boolean') {
                    handleSelectAll(checked)
                  }
                }}
                aria-label="Select all claims"
              />
            </TableHead>
            <TableHead
              className="cursor-pointer group"
              onClick={(): void => handleSort('patientId')}
            >
              Patient ID {getSortIcon('patientId')}
            </TableHead>
            <TableHead
              className="cursor-pointer group"
              onClick={(): void => handleSort('amount')}
            >
              Amount {getSortIcon('amount')}
            </TableHead>
            <TableHead
              className="cursor-pointer group"
              onClick={(): void => handleSort('status')}
            >
              Status {getSortIcon('status')}
            </TableHead>
            <TableHead
              className="cursor-pointer group"
              onClick={(): void => handleSort('createdAt')}
            >
              Created {getSortIcon('createdAt')}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>
                <Checkbox
                  checked={selectedClaims.includes(claim.id)}
                  onCheckedChange={(checked: boolean | 'indeterminate'): void => {
                    if (typeof checked === 'boolean') {
                      handleSelectClaim(claim.id, checked)
                    }
                  }}
                  aria-label={`Select claim ${claim.id}`}
                />
              </TableCell>
              <TableCell>{claim.patientId}</TableCell>
              <TableCell>{formatCurrency(claim.amount)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(claim.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingStatus?.toLowerCase()} {selectedClaims.length} claims?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={(): void => setIsUpdateDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Claims'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 