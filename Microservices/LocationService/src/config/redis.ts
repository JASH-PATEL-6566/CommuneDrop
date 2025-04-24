import Redis from 'ioredis'
import { logger } from '../utils/logger'

// Default cache TTL in seconds (30 minutes)
export const DEFAULT_CACHE_TTL = 30 * 60

// Redis connection configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10)

// Initialize Redis client
export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
})

// Set up Redis event handlers
redis.on('connect', () => {
  logger.info(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`)
})

redis.on('error', (error) => {
  logger.error({ err: error }, 'Redis connection error')
})

// Verify Redis connection
export const verifyRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redis.ping()
    logger.info(`Redis connection test: ${pong}`)
    return pong === 'PONG'
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to Redis')
    return false
  }
}

// Helper function to generate cache keys
export const generateCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join(':')
  
  return `${prefix}:${sortedParams}`
}

// Helper function to get cached data with JSON parsing
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    logger.error({ err: error, key }, 'Failed to parse cached data');
    return null;
  }
};

// Helper function to set cached data with JSON stringification
export const setCachedData = async <T>(
  key: string, 
  data: T, 
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<void> => {
  try {
    const serialized = JSON.stringify(data)
    await redis.setex(key, ttlSeconds, serialized)
  } catch (error) {
    logger.error({ err: error, key }, 'Failed to cache data')
  }
}