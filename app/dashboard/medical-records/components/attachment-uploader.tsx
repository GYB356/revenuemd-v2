import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, FileIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AttachmentUploaderProps {
  patientId: string
  onUploadComplete?: () => void
  existingAttachments?: Array<{
    name: string
    type: string
    url: string
    uploadDate: string
  }>
}

export function AttachmentUploader({
  patientId,
  onUploadComplete,
  existingAttachments = [],
}: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const [attachments, setAttachments] = useState(existingAttachments)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("patientId", patientId)

        const response = await fetch("/api/medical-records/attachments", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload file")
        }

        const data = await response.json()
        setAttachments(prev => [...prev, data.attachment])
      }

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      })

      onUploadComplete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [patientId, toast, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  })

  const handleDelete = async (fileName: string) => {
    try {
      const response = await fetch("/api/medical-records/attachments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          fileName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }

      setAttachments(prev => prev.filter(att => att.name !== fileName))
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drag and drop files here, or click to select files
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, PNG, JPG
              </p>
            </>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attachments</h4>
          <div className="divide-y">
            {attachments.map((attachment) => (
              <div
                key={attachment.name}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-gray-400" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {attachment.name}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.name)}
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 