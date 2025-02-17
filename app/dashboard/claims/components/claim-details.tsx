'use client'

import { useState } from 'react'
import { Claim } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AttachmentPreview } from '@/components/shared/AttachmentPreview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

interface ClaimDetailsProps {
  claim: Claim
  onStatusChange?: (newStatus: 'APPROVED' | 'DENIED') => Promise<void>
  onDelete?: () => Promise<void>
}

export function ClaimDetails({
  claim,
  onStatusChange,
  onDelete,
}: ClaimDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStatusChange = async (newStatus: 'APPROVED' | 'DENIED') => {
    if (!onStatusChange) return
    
    try {
      setIsUpdatingStatus(true)
      await onStatusChange(newStatus)
      toast.success(`Claim ${newStatus.toLowerCase()} successfully`)
    } catch (error) {
      console.error('Failed to update claim status:', error)
      toast.error('Failed to update claim status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete()
      toast.success('Claim deleted successfully')
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete claim:', error)
      toast.error('Failed to delete claim')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Claim Details</CardTitle>
          <div className="flex items-center gap-2">
            {claim.status === 'PENDING' && onStatusChange && (
              <>
                <Button
                  variant="success"
                  onClick={() => handleStatusChange('APPROVED')}
                  disabled={isUpdatingStatus}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange('DENIED')}
                  disabled={isUpdatingStatus}
                >
                  Deny
                </Button>
              </>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={getStatusColor(claim.status)}>
                {claim.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(claim.amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p>{formatDate(claim.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p>{formatDate(claim.updatedAt)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Patient Name</p>
                <p>{claim.patient?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Patient ID</p>
                <p>{claim.patientId}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Codes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Procedure Codes</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {claim.procedureCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Diagnosis Codes</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {claim.diagnosisCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {claim.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {claim.notes}
                </p>
              </div>
            </>
          )}

          {claim.isFraudulent && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 text-destructive">
                  Fraud Detection Results
                </h3>
                <div className="bg-destructive/10 p-4 rounded-md">
                  <p className="text-sm text-destructive mb-2">
                    This claim has been flagged as potentially fraudulent.
                  </p>
                  {claim.fraudCheckDetails && (
                    <ul className="list-disc list-inside text-sm text-destructive">
                      {claim.fraudCheckDetails.reasons.map((reason: string) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Claim</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this claim? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}