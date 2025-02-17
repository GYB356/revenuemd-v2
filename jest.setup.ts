import "@testing-library/jest-dom"
import "@testing-library/jest-dom/extend-expect"

// Add Jest matchers type declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveLength(length: number): R
      toBe(expected: any): R
      toEqual(expected: any): R
      toHaveBeenCalled(): R
      toHaveBeenCalledWith(...args: any[]): R
      toHaveBeenCalledTimes(count: number): R
      toBeNull(): R
      toHaveClass(...classNames: string[]): R
      toHaveValue(value: any): R
      toBeDisabled(): R
      rejects: {
        toThrow(message?: string | Error): Promise<R>
      }
    }
  }
}

// Mock FormData for tests
const mockFormData = class FormData {
  private data: Record<string, any[]> = {}

  append(key: string, value: any) {
    if (!this.data[key]) {
      this.data[key] = []
    }
    this.data[key].push(value)
  }

  get(key: string) {
    return this.data[key]?.[0]
  }

  getAll(key: string) {
    return this.data[key] || []
  }
}

// Mock File API for tests
const mockFile = class File {
  name: string
  type: string
  size: number
  content: any

  constructor(content: any[], name: string, options: { type: string }) {
    this.content = content
    this.name = name
    this.type = options.type
    this.size = content.reduce((size, item) => size + (item.byteLength || item.length || 0), 0)
  }
}

// Mock URL API for tests
const mockURL = class URL {
  pathname: string
  searchParams: URLSearchParams
  href: string

  constructor(url: string) {
    this.href = url
    const [pathname, search] = url.split("?")
    this.pathname = pathname
    this.searchParams = new URLSearchParams(search)
  }
}

// Mock Blob for tests
const mockBlob = class Blob {
  size: number
  type: string

  constructor(content: any[], options: { type: string }) {
    this.type = options.type
    this.size = content.reduce((size, item) => size + (item.length || 0), 0)
  }
}

// Mock ArrayBuffer for tests
const mockArrayBuffer = class ArrayBuffer {
  byteLength: number

  constructor(length: number) {
    this.byteLength = length
  }
}

// Assign mocks to global object
Object.assign(global, {
  FormData: mockFormData,
  File: mockFile,
  URL: mockURL,
  Blob: mockBlob,
  ArrayBuffer: mockArrayBuffer,
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock server components
jest.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}))

// Extend expect matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
}) 