"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from "react";
import { useLocation } from "./LocationContext";
import { useAuth } from "./AuthContext";
import {
  orderService,
  type OrderEstimateResponse,
  type CreateOrderRequest,
} from "../services/order-service";
import { tokenStorage } from "../utils/tokenStorage";
import { jwtUtils } from "../utils/jwtUtils";

export type OrderStatus =
  | "DRAFT"
  | "CREATED"
  | "CONFIRMED"
  | "PAID"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

// Update the OrderState interface to include "tracking" in the currentStep type
export interface OrderState {
  // Order details
  orderId: string | null;
  status: OrderStatus;

  // Location info
  pickup: string;
  dropoff: string;
  pickupCoordinates?: { lat: number; lng: number };
  dropoffCoordinates?: { lat: number; lng: number };

  // Package info
  weight: string;
  carrier: string;

  // Pricing and estimates
  estimatedDistance: string;
  estimatedTime: string;
  estimatedPrice: number;

  // Payment info
  paymentAmount: number | null;
  paymentIntentId: string | null;
  paymentStatus: "idle" | "processing" | "success" | "error";

  // API response data
  orderData: OrderEstimateResponse | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  currentStep: "search" | "confirm" | "payment" | "estimate" | "tracking";
}

interface OrderContextType extends OrderState {
  // Actions
  setOrderDetails: (details: Partial<OrderState>) => void;
  calculateEstimate: () => Promise<boolean>;
  confirmOrder: () => Promise<boolean>;
  processPayment: (
    paymentMethodId: string,
    customerId?: string
  ) => Promise<boolean>;
  resetOrder: () => void;
  setCurrentStep: (step: OrderState["currentStep"]) => void;
  resetOrderComplete: () => void;
}

const initialState: OrderState = {
  orderId: null,
  status: "DRAFT",
  pickup: "",
  dropoff: "",
  pickupCoordinates: undefined,
  dropoffCoordinates: undefined,
  weight: "",
  carrier: "car",
  estimatedDistance: "Calculating...",
  estimatedTime: "Calculating...",
  estimatedPrice: 0,
  paymentAmount: null,
  paymentIntentId: null,
  paymentStatus: "idle",
  orderData: null,
  isLoading: false,
  error: null,
  currentStep: "search",
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>(initialState);
  const {
    routeInfo,
    setRouteInfo,
    pickup,
    dropoff,
    pickupCoordinates,
    dropoffCoordinates,
  } = useLocation();
  const { user } = useAuth();

  // Helper to update state
  const setOrderDetails = useCallback((details: Partial<OrderState>) => {
    setState((prev) => ({ ...prev, ...details }));
  }, []);

  // Set current step
  const setCurrentStep = useCallback((step: OrderState["currentStep"]) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Update the resetOrder function to be more selective about what it resets
  const resetOrder = useCallback(() => {
    // Instead of resetting everything, only reset specific fields
    setState((prev) => ({
      ...prev,
      paymentStatus: "idle",
      error: null,
      // Keep orderId, status, and orderData intact when resetting
    }));
  }, []);

  // Add a new function to selectively reset the order state
  const resetOrderComplete = useCallback(() => {
    setState(initialState);
  }, []);

  // Parse distance string to get value and unit
  const parseDistance = useCallback((distanceStr: string) => {
    if (!distanceStr || distanceStr === "Calculating...")
      return { value: 0, unit: "km" };
    const match = distanceStr.match(/^([\d.]+)\s*(\w+)$/);
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      };
    }
    return { value: 0, unit: "km" };
  }, []);

  // Parse time string to get value and unit
  const parseTime = useCallback((timeStr: string) => {
    if (!timeStr || timeStr === "Calculating...")
      return { value: 0, unit: "mins" };
    const match = timeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      };
    }
    return { value: 0, unit: "mins" };
  }, []);

  // Calculate estimate
  const calculateEstimate = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = tokenStorage.getToken();
      let userId = "";
      if (token) {
        const tokenUserId = jwtUtils.getUserId(token);
        if (tokenUserId) {
          userId = tokenUserId;
        } else {
          userId = user?.email || "";
        }
      }

      // Use route info if available
      const estimatedDistance = routeInfo?.distance || state.estimatedDistance;
      const estimatedTime = routeInfo?.duration || state.estimatedTime;

      const requestData: CreateOrderRequest = {
        from_address: state.pickup,
        to_address: state.dropoff,
        user_id: userId,
        package_weight: Number.parseFloat(state.weight) || 0,
        delivery_instructions: "",
        vehicle_type: state.carrier.toUpperCase(),
        distance: parseDistance(estimatedDistance).value,
        time: parseTime(estimatedTime).value,
      };

      console.log("Sending order request:", requestData);
      const response = await orderService.createOrder(requestData);

      if (response.success && response.data) {
        // Extract price from response
        let price = 0;
        if (response.data.pricing_details?.total_cost) {
          price = response.data.pricing_details.total_cost;
        } else if (response.data.estimatedPrice?.total) {
          price = response.data.estimatedPrice.total;
        }

        // Update state with response data
        setState((prev) => ({
          ...prev,
          orderId: response.data.orderId,
          status: "CREATED",
          estimatedDistance,
          estimatedTime,
          estimatedPrice: price,
          orderData: response.data,
          isLoading: false,
          error: null,
        }));

        // Update route info if not already set
        if (!routeInfo) {
          setRouteInfo({
            distance: estimatedDistance,
            duration: estimatedTime,
          });
        }

        return true;
      } else {
        throw new Error(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error calculating estimate:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate price estimate. Please try again.",
      }));
      return false;
    }
  }, [
    state.pickup,
    state.dropoff,
    state.weight,
    state.carrier,
    routeInfo,
    setRouteInfo,
    user?.email,
    parseDistance,
    parseTime,
  ]);

  // Update the confirmOrder function to only use updateOrderStatus without trying to fetch the order
  const confirmOrder = useCallback(async (): Promise<boolean> => {
    if (!state.orderId) {
      setState((prev) => ({
        ...prev,
        error: "No order ID found. Please try again.",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Update the order status to CONFIRMED
      const updateResponse = await orderService.updateOrderStatus(
        state.orderId,
        "ORDER CONFIRMED"
      );

      if (!updateResponse.success) {
        throw new Error(
          updateResponse.message || "Failed to update order status"
        );
      }

      // Calculate payment amount in cents from the existing price data
      // No need to fetch the order again
      const price = state.estimatedPrice;
      const paymentAmount = Math.round(price * 100);

      // Update the state with the new status and payment amount
      setState((prev) => ({
        ...prev,
        status: "CONFIRMED",
        // Keep the existing orderData
        estimatedPrice: price,
        paymentAmount,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Error confirming order:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm your order. Please try again.",
      }));
      return false;
    }
  }, [state.orderId, state.estimatedPrice]);

  // Process payment
  const processPayment = useCallback(
    async (paymentMethodId: string, customerId?: string): Promise<boolean> => {
      if (!state.orderId) {
        setState((prev) => ({
          ...prev,
          error: "No order ID found. Please try again.",
          paymentStatus: "error",
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        paymentStatus: "processing",
      }));

      try {
        // Use the payment amount from state, or calculate it if not available
        const amount = state.paymentAmount
          ? state.paymentAmount / 100 // Convert from cents to dollars for API
          : state.estimatedPrice;

        console.log(
          `Processing payment for order ${state.orderId} with amount $${amount}`
        );

        const paymentDetails = {
          paymentMethodId,
          amount,
          currency: "usd",
          description: `Payment for order ${state.orderId}`,
          customerId: customerId || "", // Ensure customerId is never null
        };

        const paymentResponse = await orderService.processPayment(
          state.orderId,
          paymentDetails
        );

        if (paymentResponse.success) {
          setState((prev) => ({
            ...prev,
            status: "PAID",
            paymentStatus: "success",
            paymentIntentId:
              paymentResponse.data?.paymentIntentId || `pi_${Date.now()}`,
            isLoading: false,
          }));
          return true;
        } else {
          throw new Error(paymentResponse.message || "Payment failed");
        }
      } catch (error) {
        console.error("Payment error:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          paymentStatus: "error",
          error:
            error instanceof Error
              ? error.message
              : "Payment processing failed. Please try again.",
        }));
        return false;
      }
    },
    [state.orderId, state.paymentAmount, state.estimatedPrice]
  );

  // Sync location data from LocationContext
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      pickup,
      dropoff,
      pickupCoordinates,
      dropoffCoordinates,
    }));
  }, [pickup, dropoff, pickupCoordinates, dropoffCoordinates]);

  return (
    <OrderContext.Provider
      value={{
        ...state,
        setOrderDetails,
        calculateEstimate,
        confirmOrder,
        processPayment,
        resetOrder,
        setCurrentStep,
        resetOrderComplete,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
