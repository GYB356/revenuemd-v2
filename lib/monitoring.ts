import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client'
import { logger } from './logger'

// Create a Registry
const register = new Registry()

// Add default metrics
collectDefaultMetrics({ register })

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

// API error metrics
export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Count of API errors',
  labelNames: ['route', 'error_type']
})

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Count of cache hits',
  labelNames: ['cache_type']
})

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Count of cache misses',
  labelNames: ['cache_type']
})

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

// Register all metrics
register.registerMetric(httpRequestDuration)
register.registerMetric(apiErrors)
register.registerMetric(cacheHits)
register.registerMetric(cacheMisses)
register.registerMetric(dbQueryDuration)

// Middleware to track request duration
export async function trackRequestDuration(
  method: string,
  route: string,
  statusCode: number,
  startTime: number
) {
  const duration = (Date.now() - startTime) / 1000
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration)
}

// Function to track database query duration
export async function trackDbQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await queryFn()
    const duration = (Date.now() - startTime) / 1000
    dbQueryDuration.labels(operation, table).observe(duration)
    return result
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    dbQueryDuration.labels(operation, table).observe(duration)
    throw error
  }
}

// Metrics endpoint handler
export async function getMetrics() {
  try {
    const metrics = await register.metrics()
    return metrics
  } catch (error) {
    logger.error('Error collecting metrics', { error })
    throw error
  }
} 