import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    logger.error({
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    })
    
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    logger.error({
      message: 'Validation error',
      errors: error.errors
    })
    
    return NextResponse.json(
      { error: 'Invalid request parameters', details: error.errors },
      { status: 400 }
    )
  }

  logger.error({
    message: 'Unexpected error',
    error: error instanceof Error ? error.message : String(error)
  })

  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  )
} 