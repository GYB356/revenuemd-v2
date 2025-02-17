export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES = 5

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export interface FileValidationError {
  code: 'INVALID_TYPE' | 'SIZE_EXCEEDED' | 'TOO_MANY_FILES' | 'DUPLICATE_NAME'
  message: string
  details?: any
}

export function validateFile(file: File): FileValidationError | null {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Invalid file type',
      details: {
        type: file.type,
        allowedTypes: ALLOWED_FILE_TYPES,
      },
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'SIZE_EXCEEDED',
      message: 'File size exceeds limit',
      details: {
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      },
    }
  }

  return null
}

export function validateFiles(files: File[]): FileValidationError | null {
  // Check number of files
  if (files.length > MAX_FILES) {
    return {
      code: 'TOO_MANY_FILES',
      message: 'Too many files',
      details: {
        count: files.length,
        maxFiles: MAX_FILES,
      },
    }
  }

  // Check for duplicate names
  const fileNames = files.map(f => f.name)
  const uniqueFileNames = new Set(fileNames)
  if (fileNames.length !== uniqueFileNames.size) {
    return {
      code: 'DUPLICATE_NAME',
      message: 'Duplicate file names not allowed',
      details: {
        duplicates: fileNames.filter((name, index) => fileNames.indexOf(name) !== index),
      },
    }
  }

  // Validate each file
  for (const file of files) {
    const error = validateFile(file)
    if (error) return error
  }

  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2)
}

export function sanitizeFileName(filename: string): string {
  // Remove any path information
  const name = filename.split(/[\/\\]/).pop() || filename
  
  // Replace special characters
  return name.replace(/[^a-zA-Z0-9.-]/g, '_')
}

export const FILE_TYPE_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/jpg': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
} as const 