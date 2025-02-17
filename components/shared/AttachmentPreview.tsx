import React, { useState } from 'react'
import { FILE_TYPE_ICONS } from '@/lib/validation/file-validation'

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  createdAt: string
  uploadedBy: {
    id: string
    name: string
  }
}

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onDelete?: (attachmentId: string) => Promise<void>
  className?: string
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onDelete,
  className = '',
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return
    
    try {
      setIsDeleting(attachmentId)
      await onDelete(attachmentId)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (attachments.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-4 ${className}`}>
        No attachments available
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <span className="text-2xl">
              {FILE_TYPE_ICONS[attachment.type as keyof typeof FILE_TYPE_ICONS] || '📄'}
            </span>
            <div>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {attachment.name}
              </a>
              <div className="flex space-x-4 text-xs text-gray-500">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span>Uploaded {formatDate(attachment.createdAt)}</span>
                <span>•</span>
                <span>By {attachment.uploadedBy.name}</span>
              </div>
            </div>
          </div>
          
          {onDelete && (
            <button
              onClick={() => handleDelete(attachment.id)}
              disabled={isDeleting === attachment.id}
              className={`p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                ${isDeleting === attachment.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Delete attachment"
            >
              {isDeleting === attachment.id ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  )
} 