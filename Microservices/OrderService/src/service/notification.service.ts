import { OrderEvent } from "../types/subscription.type"
import { MessageBroker } from "../utils/broker" // Use the real Kafka implementation
import { fetchOrderById } from "../repository/order.repository"
import { logger } from "../utils"

export class NotificationService {
  /**
   * Sends a notification when payment is received for an order
   * Updated to include from_address, to_address, and amount instead of paymentId
   */
  static async sendPaymentReceivedNotification(orderId: string, userId: string): Promise<boolean> {
    try {
      logger.info(`Preparing payment received notification for order ${orderId}`)

      // Fetch the order to get the addresses and amount
      const order = await fetchOrderById(orderId)
      if (!order) {
        logger.error(`Cannot find order ${orderId} for notification`)
        return false
      }

      // Create notification with from_address, to_address, and amount
      const notificationData = {
        orderId,
        userId,
        from_address: order.from_address,
        to_address: order.to_address,
        amount: order.pricing_details.total_cost,
        timestamp: new Date().toISOString(),
        status: "PAYMENT_RECEIVED",
      }

      logger.info(`Sending notification: ${JSON.stringify(notificationData)}`)

      // Publish the notification to Kafka
      const result = await MessageBroker.publish({
        headers: {},
        topic: "OrderDeliveryRequests",
        event: OrderEvent.STATUS_CHANGED,
        message: notificationData,
      })

      return result
    } catch (error) {
      logger.error(`Error sending payment notification: ${error.message}`)
      return false
    }
  }
}

