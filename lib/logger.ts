import winston from 'winston'
import { config } from './config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LogEntry {
  userId: string
  action: string
  details?: string
  timestamp: Date
}

const formatMeta = (meta: any) => {
  if (!meta) return ''
  if (meta instanceof Error) {
    return meta.stack
  }
  if (typeof meta === 'object') {
    return JSON.stringify(meta, null, 2)
  }
  return meta
}

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = formatMeta(meta)
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr ? ` - ${metaStr}` : ''}`
  })
)

// Create separate transports for different environments
const createTransports = () => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        format
      )
    })
  ]

  if (config.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format
      })
    )
  }

  return transports
}

// Create the logger instance
const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: createTransports()
})

// Log unhandled rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection', { error })
})

// Log uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})

// Function to log user activity
async function logUserActivity(userId: string, action: string, details?: any) {
  try {
    const logEntry: LogEntry = {
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: new Date()
    }

    // Log to Winston
    logger.info(`User Activity: ${action}`, logEntry)

    // Store in database using a type-safe approach
    await prisma.userActivity.create({
      data: {
        userId: logEntry.userId,
        action: logEntry.action,
        details: logEntry.details,
        timestamp: logEntry.timestamp
      }
    })
  } catch (error) {
    logger.error('Failed to log user activity:', { error, userId, action })
  }
}

export { logger, logUserActivity }