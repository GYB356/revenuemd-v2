import {
  validateFile,
  validateFiles,
  formatFileSize,
  getFileExtension,
  sanitizeFileName,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_FILE_TYPES,
} from "@/lib/validation/file-validation"

describe("File Validation", () => {
  describe("validateFile", () => {
    it("accepts valid files", () => {
      const validFile = new File(["test"], "test.pdf", { type: "application/pdf" })
      expect(validateFile(validFile)).toBeNull()
    })

    it("rejects invalid file types", () => {
      const invalidFile = new File(["test"], "test.exe", { type: "application/x-msdownload" })
      const result = validateFile(invalidFile)
      
      expect(result).not.toBeNull()
      expect(result?.code).toBe("INVALID_TYPE")
      expect(result?.details.type).toBe("application/x-msdownload")
      expect(result?.details.allowedTypes).toEqual(ALLOWED_FILE_TYPES)
    })

    it("rejects files exceeding size limit", () => {
      const largeFile = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "large.pdf", { type: "application/pdf" })
      const result = validateFile(largeFile)
      
      expect(result).not.toBeNull()
      expect(result?.code).toBe("SIZE_EXCEEDED")
      expect(result?.details.maxSize).toBe(MAX_FILE_SIZE)
    })
  })

  describe("validateFiles", () => {
    it("accepts valid file collections", () => {
      const files = [
        new File(["test1"], "test1.pdf", { type: "application/pdf" }),
        new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
      ]
      expect(validateFiles(files)).toBeNull()
    })

    it("rejects too many files", () => {
      const files = Array(MAX_FILES + 1).fill(null).map((_, i) =>
        new File(["test"], `test${i}.pdf`, { type: "application/pdf" })
      )
      const result = validateFiles(files)
      
      expect(result).not.toBeNull()
      expect(result?.code).toBe("TOO_MANY_FILES")
      expect(result?.details.maxFiles).toBe(MAX_FILES)
    })

    it("rejects duplicate file names", () => {
      const files = [
        new File(["test1"], "test.pdf", { type: "application/pdf" }),
        new File(["test2"], "test.pdf", { type: "application/pdf" }),
      ]
      const result = validateFiles(files)
      
      expect(result).not.toBeNull()
      expect(result?.code).toBe("DUPLICATE_NAME")
      expect(result?.details.duplicates).toContain("test.pdf")
    })

    it("rejects if any file is invalid", () => {
      const files = [
        new File(["test1"], "test1.pdf", { type: "application/pdf" }),
        new File(["test2"], "test2.exe", { type: "application/x-msdownload" }),
      ]
      const result = validateFiles(files)
      
      expect(result).not.toBeNull()
      expect(result?.code).toBe("INVALID_TYPE")
    })
  })

  describe("formatFileSize", () => {
    it("formats file sizes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes")
      expect(formatFileSize(1024)).toBe("1 KB")
      expect(formatFileSize(1024 * 1024)).toBe("1 MB")
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB")
    })
  })

  describe("getFileExtension", () => {
    it("extracts file extensions correctly", () => {
      expect(getFileExtension("test.pdf")).toBe("pdf")
      expect(getFileExtension("test.doc.pdf")).toBe("pdf")
      expect(getFileExtension("test")).toBe("")
      expect(getFileExtension(".gitignore")).toBe("gitignore")
    })
  })

  describe("sanitizeFileName", () => {
    it("sanitizes file names correctly", () => {
      expect(sanitizeFileName("test.pdf")).toBe("test.pdf")
      expect(sanitizeFileName("test file.pdf")).toBe("test_file.pdf")
      expect(sanitizeFileName("../test.pdf")).toBe("test.pdf")
      expect(sanitizeFileName("test/file.pdf")).toBe("file.pdf")
      expect(sanitizeFileName("test\\file.pdf")).toBe("file.pdf")
      expect(sanitizeFileName("test@#$%^&*.pdf")).toBe("test_.pdf")
    })
  })
}) 