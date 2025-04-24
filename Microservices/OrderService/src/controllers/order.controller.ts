import { Request, Response } from "express";
import {
  createOrderService,
  cancleOrderService,
  orderPaymentService,
  fetchAllOrdersOfUserService,
  fetchAllOrdersOfRiderService,
  updateOrderStatusService,
} from "../service/order.service"; // Import the service
import { createApiResponse } from "../utils/response";
import { logger } from "../utils";
import { AuthenticatedRequest } from "../types";
import { fetchOrderById } from "../repository/order.repository";
import { NotificationService } from "../service/notification.service";

// Controller to handle order creation
export async function createOrderController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const orderData = req.body;

  try {
    const newOrder = await createOrderService(orderData);

    logger.info("New Order created: " + newOrder._id);
    // Return a successful response
    createApiResponse(res, "Order created successfully.", 201, newOrder);
  } catch (error) {
    createApiResponse(res, "Failed to create order: " + error.message, 500);
  }
}

// Controller to handle order creation
export async function cancleOrderController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { orderId, refundId } = req.body;
  try {
    await cancleOrderService(orderId, refundId);
    logger.info("Successfully created order: " + orderId);
    createApiResponse(res, "Order canceled successfully.", 200);
  } catch (error) {
    createApiResponse(res, "Failed to cancel order: " + error.message, 500);
  }
}

export async function orderPaymentController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  logger.info(`Payment request received with body: ${JSON.stringify(req.body)}`);
  const { orderId, paymentId } = req.body;
  try {
    const result = await orderPaymentService(orderId, paymentId);
    
    // After processing payment, fetch the order to include from_address, to_address, and amount in response
    const order = await fetchOrderById(orderId);
    
    // Return a successful response with from_address, to_address, and amount
    createApiResponse(
      res, 
      "Payment processed successfully", 
      200, 
      { 
        orderId, 
        from_address: order.from_address,
        to_address: order.to_address,
        amount: order.pricing_details.total_cost,
        status: "PAYMENT RECEIVED"
      }
    );
  } catch (error) {
    createApiResponse(
      res,
      "Failed to update payment in order service: " + error.message,
      500
    );
  }
}

export async function fetchAllOrdersOfUserController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.params.user_id;
  try {
    const fetchedOrders = await fetchAllOrdersOfUserService(userId);
    createApiResponse(res, "Orders fetched successfully.", 200, fetchedOrders);
  } catch (error) {
    createApiResponse(
      res,
      "Faild to fetch orders of user: " + error.message,
      500
    );
  }
}

export async function fetchAllOrdersOfRiderController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const riderId = req.params.rider_id;
  try {
    const fetchedOrders = await fetchAllOrdersOfRiderService(riderId);
    createApiResponse(res, "Orders fetched successfully.", 200, fetchedOrders);
  } catch (error) {
    createApiResponse(
      res,
      "Faild to fetch orders of user: " + error.message,
      500
    );
  }
}

export async function orderUpdateStatusController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { orderId, status } = req.body;
  logger.info(`Order status update request received for order ${orderId} to status ${status}`);
  
  try {
    await updateOrderStatusService(orderId, status);
    
    // If status is PAYMENT RECEIVED, send notification
    if (status === "PAYMENT RECEIVED") {
      logger.info(`Status is PAYMENT RECEIVED for order ${orderId}, sending notification`);
      try {
        const order = await fetchOrderById(orderId);
        
        // Send notification with from_address, to_address, and amount
        await NotificationService.sendPaymentReceivedNotification(
          orderId,
          order.user_id
        );
        
        logger.info(`Notification sent for order ${orderId}`);
      } catch (notificationError) {
        logger.error(`Error sending notification: ${notificationError.message}`);
      }
    }
    
    createApiResponse(res, "Order status updated successfully.", 200);
  } catch (error) {
    logger.error(`Error updating order status: ${error.message}`);
    createApiResponse(res, "Failed to update order: " + error.message, 500);
  }
}