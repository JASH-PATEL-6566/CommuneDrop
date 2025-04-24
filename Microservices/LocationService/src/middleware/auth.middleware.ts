import type { Response, NextFunction, Request } from "express"
import jwt from "jsonwebtoken"
import { AuthorizeError } from "../utils/error"
import { logger } from "../utils/logger"
import type { AuthenticatedRequest } from "../types/auth.type"

interface DecodedToken {
  scope: string | string[]
  exp: number
  iss: string
  aud: string
  client_id: string
}

export const jwtAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
  requiredScopes: string[] = ["location.read", "location.write"],
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizeError("Authorization token is required")
    }
    const token = authHeader.split(" ")[1]
    const decoded = jwt.decode(token) as DecodedToken
    if (!decoded) {
      throw new AuthorizeError("Invalid token format")
    }
    const currentTime = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < currentTime) {
      throw new AuthorizeError("Token has expired")
    }
    let tokenScopes: string[] = []
    if (decoded.scope) {
      if (typeof decoded.scope === "string") {
        tokenScopes = decoded.scope.split(" ")
      } else if (Array.isArray(decoded.scope)) {
        tokenScopes = decoded.scope
      } else {
        logger.warn(`Unexpected scope format: ${typeof decoded.scope}`)
      }
      logger.debug(`Token scopes: ${JSON.stringify(tokenScopes)}`)
    }
    const hasRequiredScope = requiredScopes.some((scope) => tokenScopes.includes(scope))
    if (!hasRequiredScope) {
      logger.warn(
        `Token missing required scopes. Required: ${requiredScopes.join(", ")}, Found: ${tokenScopes.join(", ")}`,
      )
      throw new AuthorizeError("Insufficient permissions to access this resource")
    }
    // Add user information to the request
    ;(req as AuthenticatedRequest).user = {
      clientId: decoded.client_id,
      scopes: tokenScopes,
    }
    logger.info(`Authenticated request from client: ${decoded.client_id}`)
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthorizeError("Invalid token"))
    } else {
      next(error)
    }
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest
  if (!authReq.user || !authReq.user.scopes.includes("location.admin")) {
    logger.warn(
      {
        request: {
          id: req.id,
          method: req.method,
          url: req.url.split("?")[0], // Only log the path without query parameters
        },
        user: authReq.user?.clientId,
      },
      "Unauthorized admin access attempt",
    )
    return res.status(403).json({
      status: "error",
      message: "Forbidden: Admin access required",
      timestamp: new Date().toISOString(),
    })
  }
  next()
}

export const requireScope = (scope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest
    if (!authReq.user || !authReq.user.scopes.includes(scope)) {
      logger.warn(
        {
          request: {
            id: req.id,
            method: req.method,
            url: req.url.split("?")[0], // Only log the path without query parameters
          },
          user: authReq.user?.clientId,
          requiredScope: scope,
        },
        "Missing required scope",
      )
      return res.status(403).json({
        status: "error",
        message: `Forbidden: '${scope}' scope required`,
        timestamp: new Date().toISOString(),
      })
    }
    next()
  }
}

export const authorize = (scopes: string[] = ["location.read"]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    jwtAuth(req, res, next, scopes)
  }
}

