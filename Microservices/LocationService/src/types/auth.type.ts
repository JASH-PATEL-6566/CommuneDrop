import type { Request } from "express"

export interface User {
    clientId: string
    scopes: string[]
}

export interface AuthenticatedRequest extends Request {
    user?: User
    id: string
}

