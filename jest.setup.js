// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  MONGODB_URI: 'mongodb://localhost:27017/test',
  REDIS_URL: 'redis://localhost:6379',
  OPENAI_API_KEY: 'test-openai-key',
  SENDGRID_API_KEY: 'test-sendgrid-key',
  EMAIL_FROM: 'test@revenuemd.com',
}

// Mock Redis client
jest.mock('@/lib/redis', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}))

// Mock MongoDB client
jest.mock('@/lib/mongodb', () => ({
  getMedicalRecord: jest.fn(),
  createMedicalRecord: jest.fn(),
  updateMedicalRecord: jest.fn(),
  deleteMedicalRecord: jest.fn(),
}))

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    claim: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    log: {
      create: jest.fn(),
    },
    userActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Mock OpenAI client
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}))

// Mock SendGrid client
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}))

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks()
}) 