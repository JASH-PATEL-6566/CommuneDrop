import type { Request } from "express";
export * from "./subscription.type";

export interface AuthenticatedRequest extends Request {
  user?: {
    clientId: string;
    scopes: string[];
  };
}
