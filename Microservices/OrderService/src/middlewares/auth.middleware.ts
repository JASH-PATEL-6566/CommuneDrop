import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthorizeError } from "../utils/error";
import { logger } from "../utils/logger";
import type { AuthenticatedRequest } from "../types";

interface DecodedToken {
  scope: string;
  exp: number;
  iss: string;
  aud: string;
  client_id: string;
}

export const AuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthorizeError("Authorization token is required");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token) as DecodedToken;
    if (!decoded) {
      throw new AuthorizeError("Invalid token format");
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      throw new AuthorizeError("Token has expired");
    }
    const requiredScopes = ["order.read", "order.write"];
    let tokenScopes: string[] = [];
    if (decoded.scope) {
      if (typeof decoded.scope === "string") {
        tokenScopes = decoded.scope.split(" ");
      } else if (Array.isArray(decoded.scope)) {
        tokenScopes = decoded.scope;
      } else {
        logger.warn(`Unexpected scope format: ${typeof decoded.scope}`);
      }
      logger.debug(`Token scopes: ${JSON.stringify(tokenScopes)}`);
    }
    const hasRequiredScope = requiredScopes.some((scope) =>
      tokenScopes.includes(scope)
    );
    if (!hasRequiredScope) {
      logger.warn(
        `Token missing required scopes. Required: ${requiredScopes.join(
          ", "
        )}, Found: ${tokenScopes.join(", ")}`
      );
      throw new AuthorizeError(
        "Insufficient permissions to access this resource"
      );
    }
    req.user = {
      clientId: decoded.client_id,
      scopes: tokenScopes,
    };
    logger.info(`Authenticated request from client: ${decoded.client_id}`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthorizeError("Invalid token"));
    } else {
      next(error);
    }
  }
};
