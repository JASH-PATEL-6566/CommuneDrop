import { logger } from "../utils/logger"
import dotenv from "dotenv"

dotenv.config()

// Get the order service URL from environment variables
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service"

/**
 * Updates the order status after a successful payment
 * @param orderId The ID of the order to update
 * @param token Authentication token for the order service
 * @returns Response from the order service
 */
export const updateOrderStatus = async (orderId: string, token: string): Promise<any> => {
  try {
    logger.info(`Updating order status for order ${orderId} to PAYMENT RECEIVED`)

    // Set a timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(`${ORDER_SERVICE_URL}/updateStatus`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status: "PAYMENT RECEIVED",
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        logger.error(`Failed to update order status: ${JSON.stringify(errorData)}`)
        throw new Error(`Order status update failed with status ${response.status}`)
      }

      const data = await response.json()
      logger.info(`Successfully updated order status for order ${orderId}`)
      return data
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        logger.warn(`Order status update timed out for order ${orderId}, will retry asynchronously`)
        // Schedule a retry in the background
        setTimeout(() => retryOrderStatusUpdate(orderId, token), 100)
        return { status: "pending", message: "Update scheduled asynchronously" }
      }

      throw error
    }
  } catch (error) {
    logger.error(`Error updating order status: ${error}`)
    throw error
  }
}

/**
 * Retry updating the order status with exponential backoff
 */
const retryOrderStatusUpdate = async (orderId: string, token: string, attempt = 1): Promise<void> => {
  try {
    const maxAttempts = 3
    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Exponential backoff with max 10s

    logger.info(`Retry attempt ${attempt} for order ${orderId}, waiting ${backoffMs}ms`)

    if (attempt > maxAttempts) {
      logger.error(`Failed to update order status after ${maxAttempts} attempts for order ${orderId}`)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${ORDER_SERVICE_URL}/updateStatus`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status: "PAYMENT RECEIVED",
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Order status update failed with status ${response.status}`)
      }

      logger.info(`Successfully updated order status for order ${orderId} on retry attempt ${attempt}`)
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError" || !error.message.includes("status 4")) {
        // For timeout or non-4xx errors, retry with backoff
        setTimeout(() => retryOrderStatusUpdate(orderId, token, attempt + 1), backoffMs)
      } else {
        logger.error(`Permanent error updating order status: ${error.message}`)
      }
    }
  } catch (error) {
    logger.error(`Error in retry logic for order ${orderId}: ${error}`)
  }
}

