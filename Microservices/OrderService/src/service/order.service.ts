import { CreateOrderProps } from "../types/order.type";
import {
  createOrder,
  cancleOrder,
  fetchOrderById,
  orderPayment,
  fetchAllOrdersOfUser,
  fetchAllOrdersOfRider,
  updateOrderStatus,
  refundOrder,
} from "../repository/order.repository";
import {
  getPricingDetailsFromValuationService,
  ValuationResp,
} from "./valuation.service";
import { NotificationService } from "./notification.service";
import { logger } from "../utils";

// Service function to create an order with pricing fetched from an external service
export const createOrderService = async (orderData: CreateOrderProps) => {
  const { distance, time, vehicle_type } = orderData;

  try {
    // Fetch pricing details from the Valuation Service
    const valuationResponse: ValuationResp =
      await getPricingDetailsFromValuationService(distance, time, vehicle_type);

    // Combine the pricing details with the order data
    const orderWithPricing = {
      ...orderData,
      pricing_details: valuationResponse.pricing_details,
    };

    // Call the repository to save the orderx
    const savedOrder = await createOrder(orderWithPricing);
    return savedOrder;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const cancleOrderService = async (orderId: string, refundId: string) => {
  try {
    const fetchedOrder = await fetchOrderById(orderId);

    if (fetchedOrder.status === "CANCELLED") {
      throw new Error("Order has already been cancelled");
    }
    if (
      !(
        fetchedOrder.status === "ORDER PLACED" ||
        fetchedOrder.status === "ORDER CONFIRMED"
      )
    ) {
      throw new Error("Payment doesn't made.");
    }

    if (fetchedOrder.paymentId) {
      const refundRes = await refundOrder(orderId, refundId);
      if (refundRes) {
        await cancleOrder(orderId);
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const orderPaymentService = async (
  orderId: string,
  paymentId: string
) => {
  logger.info(`Starting payment processing for order ${orderId}`);
  
  try {
    logger.info(`Fetching order ${orderId} from database`);
    const fetchedOrder = await fetchOrderById(orderId);
    
    if (
      !(
        fetchedOrder.status === "ORDER PLACED" ||
        fetchedOrder.status === "ORDER CONFIRMED"
      )
    ) {
      logger.warn(`Order ${orderId} in invalid state: ${fetchedOrder.status}`);
      throw new Error("Payment already processed or order in invalid state");
    }
    
    logger.info(`Updating payment information for order ${orderId}`);
    await orderPayment(orderId, paymentId);
    
    logger.info(`Updating order status to PAYMENT_RECEIVED for order ${orderId}`);
    await updateOrderStatus(orderId, "PAYMENT RECEIVED");
    
    // Send notification about successful payment with from_address, to_address, and amount
    try {
      logger.info(`Attempting to send notification for order ${orderId}`);
      // Note: We've removed paymentId from the notification parameters
      const notificationSent = await NotificationService.sendPaymentReceivedNotification(
        orderId,
        fetchedOrder.user_id
      );
      
      if (notificationSent) {
        logger.info(`Notification sent successfully for order ${orderId}`);
      } else {
        logger.warn(`Failed to send notification for order ${orderId}, but payment was processed successfully.`);
      }
    } catch (notificationError) {
      // Just log the error but don't fail the payment process
      logger.error(`Error sending notification for order ${orderId}: ${notificationError.message}`);
    }
    
    logger.info(`Payment processing completed successfully for order ${orderId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error processing payment for order ${orderId}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const fetchAllOrdersOfUserService = async (userId: string) => {
  try {
    const fetchedOrders = await fetchAllOrdersOfUser(userId);
    return fetchedOrders;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchAllOrdersOfRiderService = async (riderId: string) => {
  try {
    const fetchedOrders = await fetchAllOrdersOfRider(riderId);
    return fetchedOrders;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateOrderStatusService = async (
  orderId: string,
  status: string
) => {
  try {
    const result = await updateOrderStatus(orderId, status);
    
    // If the status is PAYMENT RECEIVED, send a notification
    if (status === "PAYMENT RECEIVED") {
      logger.info(`Order ${orderId} status changed to PAYMENT RECEIVED, sending notification`);
      const order = await fetchOrderById(orderId);
      
      // Send notification with from_address, to_address, and amount
      await NotificationService.sendPaymentReceivedNotification(
        orderId, 
        order.user_id
      );
    }
    
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};