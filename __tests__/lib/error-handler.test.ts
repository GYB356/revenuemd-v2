import { NextResponse } from 'next/server'
import { handleError, AppError } from '@/lib/error-handler'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logActivity } from '@/lib/activity-logger'

jest.mock('@/lib/activity-logger', () => ({
  logActivity: jest.fn(),
}))

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles AppError correctly', async () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', { detail: 'test' })
    const response = await handleError(error, 'user-1')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Test error',
      code: 'TEST_ERROR',
      details: { detail: 'test' },
      status: 400,
    })
    expect(logActivity).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'ERROR',
      details: 'Test error',
      metadata: expect.any(Object),
    })
  })

  it('handles ZodError correctly', async () => {
    const error = new ZodError([{
      code: 'invalid_type',
      expected: 'string',
      received: 'number',
      path: ['email'],
      message: 'Expected string, received number',
    }])
    const response = await handleError(error)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.errors,
      status: 400,
    })
  })

  it('handles Prisma unique constraint violation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '4.0.0',
    })
    const response = await handleError(error)

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Unique constraint violation',
      code: 'UNIQUE_VIOLATION',
      details: undefined,
      status: 409,
    })
  })

  it('handles Prisma record not found', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '4.0.0',
    })
    const response = await handleError(error)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Record not found',
      code: 'NOT_FOUND',
      details: undefined,
      status: 404,
    })
  })

  it('handles unknown errors', async () => {
    const error = new Error('Unknown error')
    const response = await handleError(error)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      status: 500,
    })
  })
}) 