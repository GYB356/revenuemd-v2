'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ClaimForm, ClaimFormData } from '@/components/claims/ClaimForm'
import { AttachmentService } from '@/lib/services/AttachmentService'
import { useAuth } from '@/hooks/useAuth'

export default function NewClaimPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ClaimFormData, files: File[]) => {
    try {
      setIsSubmitting(true)

      if (!user) {
        toast.error('Unauthorized')
        router.push('/login')
        return
      }

      // Create FormData for the request
      const formData = new FormData()
      formData.append('patientId', data.patientId)
      formData.append('amount', data.amount)
      formData.append('procedureCodes', JSON.stringify(data.procedureCodes))
      formData.append('diagnosisCodes', JSON.stringify(data.diagnosisCodes))
      if (data.notes) formData.append('notes', data.notes)

      // Upload files
      for (const file of files) {
        try {
          await AttachmentService.upload({
            file,
            entityType: 'CLAIM',
            entityId: data.patientId,
            uploadedBy: user.id,
          })
          formData.append('files', file)
        } catch (error) {
          toast.error('Failed to upload file')
          return
        }
      }

      // Submit claim
      const response = await fetch('/api/claims', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create claim')
      }

      toast.success('Claim submitted successfully')
      router.push('/dashboard/claims')
    } catch (error) {
      toast.error('Failed to submit claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Submit New Claim</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        <ClaimForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
} 