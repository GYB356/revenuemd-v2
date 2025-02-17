import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileUpload, FileList } from '@/components/shared/FileUpload'
import { FileValidationError } from '@/lib/validation/file-validation'
import { toast } from 'react-hot-toast'

export const claimSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.string().min(1, 'Amount is required'),
  procedureCodes: z.array(z.string()).min(1, 'At least one procedure code is required'),
  diagnosisCodes: z.array(z.string()).min(1, 'At least one diagnosis code is required'),
  notes: z.string().optional(),
})

export type ClaimFormData = z.infer<typeof claimSchema>

export interface ClaimFormProps {
  onSubmit: (data: ClaimFormData, files: File[]) => Promise<void>
  initialData?: Partial<ClaimFormData>
  isLoading?: boolean
}

export const ClaimForm: React.FC<ClaimFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [files, setFiles] = useState<File[]>([])
  const { register, handleSubmit, formState: { errors } } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: initialData,
  })

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles([...files, ...newFiles])
  }

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleFileError = (error: FileValidationError) => {
    toast.error(error.message)
  }

  const onFormSubmit = async (data: ClaimFormData) => {
    try {
      await onSubmit(data, files)
    } catch (error) {
      toast.error('Failed to submit claim')
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
          Patient
        </label>
        <select
          id="patientId"
          {...register('patientId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Select a patient</option>
          {/* Add patient options here */}
        </select>
        {errors.patientId && (
          <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            {...register('amount')}
            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
            step="0.01"
            disabled={isLoading}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="procedureCodes" className="block text-sm font-medium text-gray-700">
          Procedure Codes
        </label>
        <input
          type="text"
          id="procedureCodes"
          {...register('procedureCodes')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter procedure codes separated by commas"
          disabled={isLoading}
        />
        {errors.procedureCodes && (
          <p className="mt-1 text-sm text-red-600">{errors.procedureCodes.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="diagnosisCodes" className="block text-sm font-medium text-gray-700">
          Diagnosis Codes
        </label>
        <input
          type="text"
          id="diagnosisCodes"
          {...register('diagnosisCodes')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter diagnosis codes separated by commas"
          disabled={isLoading}
        />
        {errors.diagnosisCodes && (
          <p className="mt-1 text-sm text-red-600">{errors.diagnosisCodes.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Add any additional notes..."
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments
        </label>
        <FileUpload
          onFilesSelected={handleFilesSelected}
          onError={handleFileError}
          disabled={isLoading}
        />
        <FileList
          files={files}
          onRemove={handleFileRemove}
          className="mt-4"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </form>
  )
} 