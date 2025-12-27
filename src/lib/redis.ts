import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  return 'redis://localhost:6379'
}

// Create Redis client (optional - only if REDIS_URL is set)
export const redis = process.env.REDIS_URL
  ? new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })
  : null

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!redis) return
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized)
      } else {
        await redis.set(key, serialized)
      }
    } catch (error) {
      console.error('Redis SET error:', error)
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis pattern delete error:', error)
    }
  },
}
