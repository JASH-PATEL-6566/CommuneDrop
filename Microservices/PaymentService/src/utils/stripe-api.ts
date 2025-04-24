import { logger } from "./logger"
import dotenv from "dotenv"
import type {
  StripeCustomer,
  StripePaymentMethod,
  StripePaymentIntent,
  StripeRefund,
  StripeListResponse,
} from "../types/stripe-api.types"

dotenv.config()

// Stripe API base URL
const STRIPE_API_BASE = "https://api.stripe.com/v1"

// Get Stripe secret key from environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

// Configure timeouts - payment intents need longer timeouts
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const PAYMENT_INTENT_TIMEOUT = 60000 // 60 seconds for payment operations

// Headers for Stripe API requests
const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
  }

  return headers
}

// Convert object to URL encoded form data
const objectToFormData = (obj: Record<string, any>, parentKey = ""): string => {
  const result: string[] = []

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const encodedKey = parentKey ? `${parentKey}[${key}]` : key

      if (value === null || value === undefined) {
        continue
      } else if (typeof value === "object" && !Array.isArray(value)) {
        result.push(objectToFormData(value, encodedKey))
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            result.push(objectToFormData(item, `${encodedKey}[${index}]`))
          } else {
            result.push(`${encodedKey}[${index}]=${encodeURIComponent(item)}`)
          }
        })
      } else {
        result.push(`${encodedKey}=${encodeURIComponent(value)}`)
      }
    }
  }

  return result.join("&")
}

// Create a fetch with timeout function
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

// Generic function to make Stripe API requests
export const stripeRequest = async <T>(
  method: string,
  endpoint: string,
  data?: Record<string, any>
)
: Promise<T> =>
{
  const url = `${STRIPE_API_BASE}${endpoint}`

  // Determine if this is a payment intent operation
  const isPaymentIntent = endpoint.includes("/payment_intents")
  const timeout = isPaymentIntent ? PAYMENT_INTENT_TIMEOUT : DEFAULT_TIMEOUT

  try {
    const options: RequestInit = {
      method,
      headers: getHeaders(),
    }

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = objectToFormData(data)
    }

    // For GET requests with parameters, append them to the URL
    const fullUrl = method === "GET" && data ? `${url}?${objectToFormData(data)}` : url

    logger.info(`Making Stripe API request: ${method} ${endpoint} with timeout ${timeout}ms`)

    // Use our custom fetch with timeout
    const response = await fetchWithTimeout(fullUrl, options, timeout)

    // Log response status
    logger.info(`Received response from Stripe: ${response.status} ${response.statusText}`)

    // Parse response as JSON
    const responseData = await response.json()

    if (!response.ok) {
      logger.error(`Stripe API error: ${response.status} ${JSON.stringify(responseData)}`)
      throw new Error(responseData.error?.message || "Stripe API request failed")
    }

    // For payment intents, log additional details
    if (isPaymentIntent && responseData) {
      logger.info(`Payment Intent processed: ID=${responseData.id}, Status=${responseData.status}`)
    }

    return responseData as T;
  } catch (error: any) {
    // Improved error logging
    if (error.name === "AbortError") {
      logger.error(`Stripe API request timed out after ${timeout}ms: ${method} ${endpoint}`)
      throw new Error(`Stripe API request timed out after ${timeout}ms`)
    } else {
      logger.error(`Error making Stripe API request to ${endpoint}:`, error)
      throw error
    }
  }
}

// Stripe API endpoints
export const stripeApi = {
  customers: {
    create: (data: Record<string, any>) => stripeRequest<StripeCustomer>("POST", "/customers", data),
    retrieve: (id: string) => stripeRequest<StripeCustomer>("GET", `/customers/${id}`),
    update: (id: string, data: Record<string, any>) => stripeRequest<StripeCustomer>("POST", `/customers/${id}`, data),
    list: (params?: Record<string, any>) =>
      stripeRequest<StripeListResponse<StripeCustomer>>("GET", "/customers", params),
  },
  paymentMethods: {
    create: (data: Record<string, any>) => stripeRequest<StripePaymentMethod>("POST", "/payment_methods", data),
    retrieve: (id: string) => stripeRequest<StripePaymentMethod>("GET", `/payment_methods/${id}`),
    update: (id: string, data: Record<string, any>) =>
      stripeRequest<StripePaymentMethod>("POST", `/payment_methods/${id}`, data),
    list: (params: Record<string, any>) =>
      stripeRequest<StripeListResponse<StripePaymentMethod>>("GET", "/payment_methods", params),
    attach: (id: string, data: Record<string, any>) =>
      stripeRequest<StripePaymentMethod>("POST", `/payment_methods/${id}/attach`, data),
    detach: (id: string) => stripeRequest<StripePaymentMethod>("POST", `/payment_methods/${id}/detach`),
  },
  paymentIntents: {
    create: (data: Record<string, any>) => stripeRequest<StripePaymentIntent>("POST", "/payment_intents", data),
    retrieve: (id: string) => stripeRequest<StripePaymentIntent>("GET", `/payment_intents/${id}`),
    update: (id: string, data: Record<string, any>) =>
      stripeRequest<StripePaymentIntent>("POST", `/payment_intents/${id}`, data),
    confirm: (id: string, data?: Record<string, any>) =>
      stripeRequest<StripePaymentIntent>("POST", `/payment_intents/${id}/confirm`, data),
    cancel: (id: string, data?: Record<string, any>) =>
      stripeRequest<StripePaymentIntent>("POST", `/payment_intents/${id}/cancel`, data),
  },
  refunds: {
    create: (data: Record<string, any>) => stripeRequest<StripeRefund>("POST", "/refunds", data),
    retrieve: (id: string) => stripeRequest<StripeRefund>("GET", `/refunds/${id}`),
    update: (id: string, data: Record<string, any>) => stripeRequest<StripeRefund>("POST", `/refunds/${id}`, data),
    list: (params?: Record<string, any>) => stripeRequest<StripeListResponse<StripeRefund>>("GET", "/refunds", params),
  },
}

