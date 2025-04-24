export class AuthorizeError extends Error {
    statusCode: number
    constructor(message: string) {
        super(message)
        this.name = "AuthorizeError"
        this.statusCode = 403
        Object.setPrototypeOf(this, AuthorizeError.prototype)
    }
}

export class NotFoundError extends Error {
    statusCode: number
    constructor(message: string) {
        super(message)
        this.name = "NotFoundError"
        this.statusCode = 404
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
}

export class ValidationError extends Error {
    statusCode: number
    constructor(message: string) {
        super(message)
        this.name = "ValidationError"
        this.statusCode = 400
        Object.setPrototypeOf(this, ValidationError.prototype)
    }
}

