import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

import { createApiResponse } from "../utils/response";

// Middleware to validate order creation
export function validateOrderCreationRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const {
    from_address,
    to_address,
    user_id,
    package_weight,
    vehicle_type,
    distance,
    time,
  } = req.body;

  if (
    !from_address ||
    !to_address ||
    !user_id ||
    !package_weight ||
    !vehicle_type ||
    !distance ||
    !time
  ) {
    createApiResponse(res, "All required fields must be provided.", 400);
    return;
  }

  const validVehicleTypes = ["BIKE", "CAR", "TRUCK", "WALK"];
  if (!validVehicleTypes.includes(vehicle_type)) {
    createApiResponse(
      res,
      "Invalid vehicle type. Valid types are BIKE, CAR, TRUCK, WALK.",
      400
    );
    return;
  }

  next();
}

// Middleware to validate order cancellation
export function validateOrderCancellationRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { order_id } = req.params;

  if (!order_id) {
    createApiResponse(res, "Order ID is required for payment.", 400);
    return;
  }

  next();
}

// Middleware to validate order payment request
export function validateOrderPaymentRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { order_id } = req.params;

  if (!order_id) {
    createApiResponse(res, "Order ID is required to process payment.", 400);
    return;
  }

  next();
}

// Middleware to validate fetching orders by user ID
export function validateFetchOrdersOfUserRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { user_id } = req.params;

  if (!user_id) {
    createApiResponse(res, "User ID is required.", 400);
    return;
  }

  next();
}

// Middleware to validate fetching orders by rider ID
export function validateFetchOrdersOfRiderRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { rider_id } = req.params;

  if (!rider_id) {
    createApiResponse(res, "Rider ID is required.", 400);
    return;
  }

  next();
}

// Middleware to validate order update request
export function validateOrderUpdateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { orderId, status } = req.body;

  if (!orderId) {
    createApiResponse(res, "Order ID is required for cancellation.", 400);
    return;
  }

  const validOrderStatus = [
    "ORDER PLACED",
    "ORDER CONFIRMED",
    "PAYMENT RECEIVED",
    "AWAITING PICKUP",
    "PICKED UP",
    "OUT FOR DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];
  if (!validOrderStatus.includes(status)) {
    createApiResponse(res, "Invalid Order Status.", 400);
    return;
  }

  next();
}

export function validateOrderRefnudRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { orderId, refundId } = req.body;

  if (!orderId) {
    createApiResponse(res, "Order ID is required.", 400);
    return;
  }

  if (!refundId) {
    createApiResponse(res, "Refund ID is required.", 400);
    return;
  }

  next();
}
