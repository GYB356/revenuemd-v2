'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// Validation schema for new claim
const newClaimSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  amount: z.number().positive('Amount must be positive'),
  insuranceProvider: z.string().min(1, 'Insurance provider is required'),
  procedureCodes: z.string().transform(str => str.split(',').map(s => s.trim())),
  diagnosisCodes: z.string().transform(str => str.split(',').map(s => s.trim())),
  notes: z.string().optional(),
})

type NewClaimFormData = z.infer<typeof newClaimSchema>

interface Claim {
  id: string
  patientName: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  submittedDate: string
  insuranceProvider: string
  procedureCodes: string[]
  diagnosisCodes: string[]
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewClaimFormData>({
    resolver: zodResolver(newClaimSchema),
  })

  // Fetch claims
  useEffect(() => {
    fetchClaims()
  }, [page, statusFilter, searchTerm])

  async function fetchClaims() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/v1/claims?${params}`)
      if (!response.ok) throw new Error('Failed to fetch claims')

      const data = await response.json()
      setClaims(data.claims)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      toast.error('Failed to fetch claims')
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  // Submit new claim
  async function onSubmit(data: NewClaimFormData) {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/v1/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to submit claim')

      toast.success('Claim submitted successfully')
      setShowNewClaimDialog(false)
      reset()
      fetchClaims()
    } catch (error) {
      toast.error('Failed to submit claim')
      console.error('Error submitting claim:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Process claim
  async function processClaim(claimId: string, status: 'APPROVED' | 'DENIED', reason?: string) {
    try {
      const response = await fetch('/api/v1/claims/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          status,
          reason,
        }),
      })

      if (!response.ok) throw new Error('Failed to process claim')

      toast.success(`Claim ${status.toLowerCase()} successfully`)
      setSelectedClaim(null)
      fetchClaims()
    } catch (error) {
      toast.error('Failed to process claim')
      console.error('Error processing claim:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Claims</h2>
          <p className="text-muted-foreground">
            Submit and manage insurance claims
          </p>
        </div>
        <Button onClick={() => setShowNewClaimDialog(true)}>
          <Icons.plus className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:space-x-4">
        <div className="relative flex-1">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DENIED">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Claim ID</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Insurance</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Icons.spinner className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No claims found
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {claims.map((claim) => (
                    <motion.tr
                      key={claim.id}
                      className="border-b"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="px-4 py-3">{claim.id}</td>
                      <td className="px-4 py-3 font-medium">{claim.patientName}</td>
                      <td className="px-4 py-3">${claim.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            claim.status === 'APPROVED'
                              ? 'bg-success/10 text-success'
                              : claim.status === 'PENDING'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{claim.submittedDate}</td>
                      <td className="px-4 py-3">{claim.insuranceProvider}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {claim.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => processClaim(claim.id, 'APPROVED')}
                              >
                                <Icons.check className="h-4 w-4 text-success" />
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => processClaim(claim.id, 'DENIED')}
                              >
                                <Icons.x className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Deny</span>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Icons.edit className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <Icons.chevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* New Claim Dialog */}
      <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit New Claim</DialogTitle>
            <DialogDescription>
              Enter the claim details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="patientId">Patient ID</label>
                <Input
                  id="patientId"
                  {...register('patientId')}
                  className={errors.patientId ? 'border-red-500' : ''}
                />
                {errors.patientId && (
                  <p className="text-xs text-red-500">{errors.patientId.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="amount">Amount</label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-xs text-red-500">{errors.amount.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="insuranceProvider">Insurance Provider</label>
                  <Select
                    onValueChange={(value: string) => {
                      register('insuranceProvider').onChange({
                        target: { value, name: 'insuranceProvider' },
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bluecross">Blue Cross</SelectItem>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="medicare">Medicare</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.insuranceProvider && (
                    <p className="text-xs text-red-500">{errors.insuranceProvider.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="procedureCodes">Procedure Codes</label>
                <Input
                  id="procedureCodes"
                  {...register('procedureCodes')}
                  placeholder="e.g., 99213, 85025"
                  className={errors.procedureCodes ? 'border-red-500' : ''}
                />
                {errors.procedureCodes && (
                  <p className="text-xs text-red-500">{errors.procedureCodes.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="diagnosisCodes">Diagnosis Codes</label>
                <Input
                  id="diagnosisCodes"
                  {...register('diagnosisCodes')}
                  placeholder="e.g., E11.9, I10"
                  className={errors.diagnosisCodes ? 'border-red-500' : ''}
                />
                {errors.diagnosisCodes && (
                  <p className="text-xs text-red-500">{errors.diagnosisCodes.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  setShowNewClaimDialog(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Claim
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Claim Details Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Claim ID</label>
                  <p className="mt-1">{selectedClaim.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Patient Name</label>
                  <p className="mt-1">{selectedClaim.patientName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="mt-1">${selectedClaim.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="mt-1">{selectedClaim.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Insurance Provider</label>
                <p className="mt-1">{selectedClaim.insuranceProvider}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Procedure Codes</label>
                <p className="mt-1">{selectedClaim.procedureCodes.join(', ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Diagnosis Codes</label>
                <p className="mt-1">{selectedClaim.diagnosisCodes.join(', ')}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
              Close
            </Button>
            {selectedClaim?.status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => processClaim(selectedClaim.id, 'DENIED')}
                >
                  Deny Claim
                </Button>
                <Button
                  onClick={() => processClaim(selectedClaim.id, 'APPROVED')}
                >
                  Approve Claim
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 