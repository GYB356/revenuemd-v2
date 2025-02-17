'use client'

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Upload, File } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadProps {
  value: Array<{
    name: string
    type: string
    url: string
    uploadDate: string
  }>
  onChange: (files: Array<{
    name: string
    type: string
    url: string
    uploadDate: string
  }>) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      for (const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Error",
            description: `File ${file.name} exceeds maximum size of 5MB`,
            variant: "destructive",
          })
          continue
        }

        // Create form data
        const formData = new FormData()
        formData.append('file', file)

        // Upload file
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()

        // Add file to list
        onChange([
          ...value,
          {
            name: file.name,
            type: file.type,
            url: data.url,
            uploadDate: new Date().toISOString(),
          },
        ])

        setUploadProgress((prev) => prev + (100 / acceptedFiles.length))
      }

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [value, onChange, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    disabled: disabled || uploading,
  })

  const removeFile = (index: number) => {
    const newFiles = [...value]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag & drop files here, or click to select files
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, JPG, PNG up to 5MB
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-gray-500 text-center">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 