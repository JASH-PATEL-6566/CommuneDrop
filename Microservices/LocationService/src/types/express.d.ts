import "express"
import type { User } from "./auth.type"

declare global {
  namespace Express {
    interface Request {
      id: string
      user?: User
    }

    interface Response {
      responseTime?: number
    }
  }
}

