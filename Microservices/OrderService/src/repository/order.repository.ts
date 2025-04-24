import { Order } from "../db/Models/Order";
import { CreateOrderProps } from "../types/order.type";
import { logger } from "../utils";

// Function to save a new order in the database
export const createOrder = async (orderData: CreateOrderProps) => {
  const newOrder = new Order({
    from_address: orderData.from_address,
    to_address: orderData.to_address,
    user_id: orderData.user_id,
    package_weight: orderData.package_weight,
    vehicle_type: orderData.vehicle_type,
    delivery_instructions: orderData.delivery_instructions,
    pricing_details: orderData.pricing_details,
    distance: orderData.distance,
    time: orderData.time,
    paymentAt: new Date(),
  });

  try {
    await newOrder.save();
    return newOrder;
  } catch (error) {
    throw new Error("Error saving the order: " + error.message);
  }
};

// Function to cancel an order in the database
export const cancleOrder = async (orderId: string) => {
  try {
    await Order.updateOne({ _id: orderId }, { status: "CANCELLED" });
  } catch (error) {
    throw new Error("Error cancelling the order: " + error.message);
  }
};

export const fetchOrderById = async (orderId: string) => {
  try {
    const fetchedOrder = await Order.findOne({ _id: orderId });
    logger.info("Order fetched successfully");
    return fetchedOrder;
  } catch (error) {
    throw new Error("Error fetching order: " + error.message);
  }
};

export const orderPayment = async (orderId: string, paymentId: string) => {
  try {
    await Order.updateOne(
      { _id: orderId },
      {
        paymentId,
      }
    );
  } catch (error) {
    throw new Error("Error while updating payment of order: " + error.message);
  }
};

export const refundOrder = async (orderId: string, refundId: string) => {
  try {
    return await Order.updateOne(
      { _id: orderId },
      {
        refundId,
      }
    );
  } catch (error) {
    throw new Error("Error while updating payment of order: " + error.message);
  }
};

export const fetchAllOrdersOfUser = async (userId: string) => {
  try {
    const fetchOrders = await Order.find({ user_id: userId });
    logger.info("User: Orders fetched successfully");
    return fetchOrders;
  } catch (error) {
    throw new Error("Error fetching orders: " + error.message);
  }
};

export const fetchAllOrdersOfRider = async (riderId: string) => {
  try {
    const fetchOrders = await Order.find({ rider_id: riderId });
    logger.info("Rider: Orders fetched successfully");
    return fetchOrders;
  } catch (error) {
    throw new Error("Error fetching orders: " + error.message);
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    await Order.updateOne({ _id: orderId }, { status });
  } catch (error) {
    throw new Error("Error updating order status: " + error.message);
  }
};
