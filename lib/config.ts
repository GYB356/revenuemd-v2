import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: z.number().int().positive().default(20),
  RATE_LIMIT_WINDOW: z.number().int().positive().default(10), // seconds
  
  // Cache
  CACHE_TTL: z.number().int().positive().default(300), // 5 minutes
  
  // API
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

function validateEnv() {
  try {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      RATE_LIMIT_REQUESTS: Number(process.env.RATE_LIMIT_REQUESTS),
      RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW),
      CACHE_TTL: Number(process.env.CACHE_TTL),
      API_BASE_URL: process.env.API_BASE_URL,
      NODE_ENV: process.env.NODE_ENV
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'))
      throw new Error(`❌ Invalid environment variables: ${missingVars.join(', ')}`)
    }
    throw error
  }
}

export const config = validateEnv() 