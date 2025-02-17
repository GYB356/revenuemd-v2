import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload, FileList } from '@/components/shared/FileUpload'
import { validateFiles } from '@/lib/validation/file-validation'

// Mock the validation module
jest.mock('@/lib/validation/file-validation', () => ({
  validateFiles: jest.fn(),
  formatFileSize: (bytes: number) => `${bytes} bytes`,
  FILE_TYPE_ICONS: {
    'application/pdf': '📄',
  },
}))

describe('FileUpload', () => {
  const mockOnFilesSelected = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(validateFiles as jest.Mock).mockReturnValue(null)
  })

  it('renders upload area with correct text', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />)
    
    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument()
    expect(screen.getByText(/supported files/i)).toBeInTheDocument()
  })

  it('shows single file text when multiple is false', () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        multiple={false}
      />
    )
    
    expect(screen.getByText(/drag & drop a file here/i)).toBeInTheDocument()
  })

  it('shows disabled state', () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        disabled={true}
      />
    )
    
    const uploadArea = screen.getByText(/drag & drop files here/i).parentElement
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('handles file drop correctly', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const dropEvent = {
      dataTransfer: {
        files: [file],
      },
    }

    const uploadArea = screen.getByText(/drag & drop files here/i).parentElement
    fireEvent.drop(uploadArea!, dropEvent)

    expect(validateFiles).toHaveBeenCalledWith([file])
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file])
    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('handles validation errors', async () => {
    const validationError = {
      code: 'INVALID_TYPE',
      message: 'Invalid file type',
      details: { type: 'application/exe' },
    }
    ;(validateFiles as jest.Mock).mockReturnValue(validationError)

    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.exe', { type: 'application/exe' })
    const dropEvent = {
      dataTransfer: {
        files: [file],
      },
    }

    const uploadArea = screen.getByText(/drag & drop files here/i).parentElement
    fireEvent.drop(uploadArea!, dropEvent)

    expect(validateFiles).toHaveBeenCalledWith([file])
    expect(mockOnFilesSelected).not.toHaveBeenCalled()
    expect(mockOnError).toHaveBeenCalledWith(validationError)
  })
})

describe('FileList', () => {
  const mockOnRemove = jest.fn()
  const mockFiles = [
    new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
    new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when file list is empty', () => {
    const { container } = render(<FileList files={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders file list correctly', () => {
    render(<FileList files={mockFiles} onRemove={mockOnRemove} />)
    
    expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    expect(screen.getByText('test2.jpg')).toBeInTheDocument()
  })

  it('handles file removal', () => {
    render(<FileList files={mockFiles} onRemove={mockOnRemove} />)
    
    const removeButtons = screen.getAllByLabelText('Remove file')
    fireEvent.click(removeButtons[0])

    expect(mockOnRemove).toHaveBeenCalledWith(0)
  })

  it('does not show remove button when onRemove is not provided', () => {
    render(<FileList files={mockFiles} />)
    
    expect(screen.queryByLabelText('Remove file')).not.toBeInTheDocument()
  })
}) 