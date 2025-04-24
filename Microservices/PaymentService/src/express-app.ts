import express, { type NextFunction, type Request, type Response } from "express"
import cors from "cors"
import { setupSwagger } from "./swagger"
import paymentRoutes from "./routes/payment.routes"

export const ExpressApp = async () => {
  const app = express()
  app.use(cors())
  app.use(express.json())

  // Set up Swagger documentation
  setupSwagger(app)

  app.use("/payment", paymentRoutes)

  app.use("/", (req: Request, res: Response, _: NextFunction) => {
    res.status(200).json({ message: "I am healthy!" })
  })

  return app
}

