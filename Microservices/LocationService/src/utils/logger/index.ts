import { randomUUID } from "crypto"
import pino from "pino"
import { pinoHttp } from "pino-http"
import { SERVER_CONFIG } from "../../config"

const logLevel = SERVER_CONFIG.LOG_LEVEL

// Simplified logger configuration
export const logger = pino({
  level: logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: "SYS:standard",
    },
  },
})

export const startTimer = () => {
  const start = process.hrtime.bigint()
  return () => {
    const end = process.hrtime.bigint()
    return Number(end - start) / 1_000_000
  }
}

// Modified HTTP logger to limit request logging
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error"
    if (res.statusCode >= 400) return "warn"
    return "info"
  },
  // Customize what gets logged for requests
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url.split("?")[0], // Only log the path without query parameters
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  // Don't log the entire request body
  autoLogging: {
    ignore: (req) => req.url.includes("/health"),
  },
  // Customize the log message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url.split("?")[0]} completed with ${res.statusCode}`
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url.split("?")[0]} failed with ${res.statusCode}`
  },
})

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception, shutting down")
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled rejection, shutting down")
  process.exit(1)
})

