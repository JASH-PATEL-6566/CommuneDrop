import app from "./express-app"
import { logger } from "./utils/logger"
import { SERVER_CONFIG } from "./config"

const PORT = SERVER_CONFIG.PORT

const startServer = () => {
  try {
    // Simplified startup without detailed system info logging
    const server = app.listen(PORT, () => {
      logger.info(`Location Service running on port ${PORT}`)
      logger.info(`Environment: ${SERVER_CONFIG.NODE_ENV}`)
    })

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Please choose a different port.`)
        process.exit(1)
      } else {
        logger.error(`Failed to start server: ${error.message}`)
        process.exit(1)
      }
    })

    const shutdown = () => {
      logger.info("Shutting down gracefully...")
      server.close(() => {
        logger.info("Server closed successfully")
        process.exit(0)
      })
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down")
        process.exit(1)
      }, 10000)
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  } catch (error) {
    logger.fatal(`Failed to start Location Service: ${error.message}`)
    process.exit(1)
  }
}

startServer()

