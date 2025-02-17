import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { validateFiles, formatFileSize, FILE_TYPE_ICONS, FileValidationError } from '@/lib/validation/file-validation'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onError?: (error: FileValidationError) => void
  className?: string
  multiple?: boolean
  disabled?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onError,
  className = '',
  multiple = true,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const error = validateFiles(acceptedFiles)
    if (error) {
      onError?.(error)
      return
    }
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <div className="text-4xl mb-2">📎</div>
        <p className="text-sm text-gray-600">
          {isDragActive
            ? "Drop the files here..."
            : multiple
              ? "Drag & drop files here, or click to select files"
              : "Drag & drop a file here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Supported files: PDF, Word, Images (JPEG, PNG) • Max size: 10MB
        </p>
      </div>
    </div>
  )
}

interface FileListProps {
  files: File[]
  onRemove?: (index: number) => void
  className?: string
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  className = '',
}) => {
  if (files.length === 0) return null

  return (
    <div className={`mt-4 space-y-2 ${className}`}>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">
              {FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS] || '📄'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Remove file"
            >
              <span className="text-gray-500 text-lg">×</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
} 