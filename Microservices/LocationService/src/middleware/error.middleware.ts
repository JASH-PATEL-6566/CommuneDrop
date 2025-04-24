import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    {
      err,
      request: {
        id: req.id,
        method: req.method,
        url: req.url.split("?")[0], // Only log the path without query parameters
      },
      user: (req as any).user?.clientId,
    },
    `Error handling request: ${err.message}`,
  )
  if (res.headersSent) {
    return next(err)
  }
  const statusCode = (err as any).statusCode || 500
  const errorResponse = {
    status: "error",
    message: process.env.NODE_ENV === "production" && statusCode === 500 ? "Internal Server Error" : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
      code: (err as any).code,
    }),
  }
  res.status(statusCode).json(errorResponse)
}

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(
    {
      request: {
        id: req.id,
        method: req.method,
        url: req.url.split("?")[0], // Only log the path without query parameters
        ip: req.ip,
      },
    },
    `Route not found: ${req.method} ${req.originalUrl}`,
  )
  res.status(404).json({
    status: "error",
    message: "The requested resource was not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
}

