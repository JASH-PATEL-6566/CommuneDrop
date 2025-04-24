import type { Request, Response } from "express"
import { logger } from "../utils/logger"
import { redis } from "../config/redis"

export const clearAllCache = async (req: Request, res: Response) => {
    try {
        await redis.flushall()
        logger.info("Cache cleared successfully")
        res.json({ message: "Cache cleared successfully" })
    } catch (error) {
        logger.error({ err: error }, "Cache clear error")
        res.status(500).json({ error: error.message })
    }
}

export const clearCacheByPrefix = async (req: Request, res: Response) => {
    try {
        const { prefix } = req.params
        if (!prefix) {
        return res.status(400).json({ error: "Cache prefix is required" })
        }
        const keys = await redis.keys(`${prefix}:*`)
        if (keys.length === 0) {
        return res.json({ message: `No cache keys found with prefix ${prefix}` })
        }
        const deleted = await redis.del(...keys)
        logger.info(`Deleted ${deleted} cache keys with prefix ${prefix}`)
        res.json({ message: `Deleted ${deleted} cache keys with prefix ${prefix}` })
    } catch (error) {
        logger.error({ err: error }, "Cache delete error")
        res.status(500).json({ error: error.message })
    }
}

export const getCacheStats = async (req: Request, res: Response) => {
    try {
        const info = await redis.info()
        const dbSize = await redis.dbsize()
        const coordinatesCount = (await redis.keys("coordinates:*")).length
        const routeCount = (await redis.keys("route:*")).length
        const detailedRouteCount = (await redis.keys("detailedRoute:*")).length
        const suggestionsCount = (await redis.keys("suggestions:*")).length
        res.json({
        totalKeys: dbSize,
        typeCounts: {
            coordinates: coordinatesCount,
            routes: routeCount,
            detailedRoutes: detailedRouteCount,
            suggestions: suggestionsCount,
        },
        redisInfo: info,
        })
    } catch (error) {
        logger.error({ err: error }, "Cache stats error")
        res.status(500).json({ error: error.message })
    }
}

