import { logger } from "./logger"

// Track the execution time of an async function
export const trackPerformance = async <T>(
  operationName: string,
  fn: () => Promise<T>,
  meta: Record<string, any> = {}
)
: Promise<T> =>
{
  try {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = (end - start).toFixed(2)

    logger.info(`[Performance] ${operationName} took ${duration}ms`, { ...meta, duration })

    return result;
  } catch (error: any) {
    logger.error(`[Performance] ${operationName} failed`, { ...meta, error: error.message })
    throw error
  }
}

// These functions are removed as they're not needed
export const logResourceUsage = () => {}
export const startResourceMonitoring = () => {
  return () => {}
}

