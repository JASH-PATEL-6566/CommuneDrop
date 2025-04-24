import express, { NextFunction, Request, Response } from "express";
import locationRoutes from "./routes/location.routes"
import { httpLogger } from "./utils/logger"
import cors from "cors"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware"
import docsRoutes from "./routes/doc.routes"
import crypto from "crypto"
import { serve, setup } from "./swagger"

const app = express()

app.use((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID()
  req.id = requestId
  res.setHeader("X-Request-ID", requestId)
  next()
})
app.use(express.json())
app.use(cors())
app.use(httpLogger)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("X-Frame-Options", "DENY")
  next()
})

// Swagger documentation
app.use("/api-docs", serve, setup)
app.use("/docs", docsRoutes)
app.use("/location", locationRoutes)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  })
})
app.use("/", (req: Request, res: Response, _: NextFunction) => {
  res.status(200).json({ message: "I am healthy!" });
});
app.use(notFoundHandler)
app.use(errorHandler)
export default app

