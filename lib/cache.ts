import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

export class Cache {
  private prefix: string

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'cache:'
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key))
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.getKey(key)
      const data = JSON.stringify(value)
      
      if (ttl) {
        await redis.setex(cacheKey, ttl, data)
      } else {
        await redis.set(cacheKey, data)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key))
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) {
      return cached
    }

    const fresh = await fn()
    await this.set(key, fresh, ttl)
    return fresh
  }
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}