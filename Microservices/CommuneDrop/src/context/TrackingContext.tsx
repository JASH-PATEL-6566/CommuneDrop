"use client";

import type React from "react";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNotifications } from "../components/notifications/NotificationProvider";
import { useOrder } from "./OrderContext";

// Define the driver location type
export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

// Define the order status update type
export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: number;
  estimatedArrival?: string;
  message?: string;
  driver?: any; // Add driver property
}

// Define the tracking context type
interface TrackingContextType {
  isTracking: boolean;
  driverLocation: DriverLocation | null;
  orderStatus: OrderStatusUpdate | null;
  startTracking: (orderId: string) => void;
  stopTracking: () => void;
}

// Create the context
const TrackingContext = createContext<TrackingContextType | undefined>(
  undefined
);

// Create the provider component
export const TrackingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null
  );
  const [orderStatus, setOrderStatus] = useState<OrderStatusUpdate | null>(
    null
  );

  const { notifications } = useNotifications();
  const { orderId } = useOrder();

  // Start tracking a specific order
  const startTracking = (orderId: string) => {
    setTrackingOrderId(orderId);
    setIsTracking(true);
    console.log(`Started tracking order: ${orderId}`);
  };

  // Stop tracking
  const stopTracking = () => {
    setTrackingOrderId(null);
    setIsTracking(false);
    setDriverLocation(null);
    setOrderStatus(null);
    console.log("Stopped tracking order");
  };

  // Update the notification filtering logic in the TrackingContext to handle the standardized format
  useEffect(() => {
    // Only process notifications if we're tracking an order
    if (!isTracking || !trackingOrderId) return;

    console.log("Checking notifications for order:", trackingOrderId);
    console.log("Available notifications:", notifications);

    // Find the most recent notifications that match our tracking criteria using the standardized format
    const recentNotifications = [...notifications]
      .filter((notification) => {
        // Check if this notification is for our order using the standardized format
        if (
          notification.data &&
          notification.data.orderId === trackingOrderId
        ) {
          return [
            "OrderStatusUpdated",
            "Order Accepted",
            "DriverAssigned",
            "DriverLiveLocation",
          ].includes(notification.eventType);
        }

        // Fallback to message content check for backward compatibility
        if (typeof notification.message === "string") {
          return notification.message.includes(trackingOrderId);
        }

        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    console.log("Filtered notifications:", recentNotifications);

    // Process driver location updates
    const locationUpdate = recentNotifications.find(
      (n) => n.eventType === "DriverLiveLocation"
    );

    if (locationUpdate && locationUpdate.data) {
      console.log("Found location update:", locationUpdate);

      try {
        // Get location data from the standardized format
        const locationData = locationUpdate.data.data?.location;

        if (locationData && locationData.lat && locationData.lng) {
          setDriverLocation({
            lat: locationData.lat,
            lng: locationData.lng,
            heading: locationData.heading,
            speed: locationData.speed,
            timestamp: new Date(locationUpdate.timestamp).getTime(),
          });
          console.log("Updated driver location from standardized data");
        }
      } catch (e) {
        console.error("Error processing driver location data:", e);
      }
    }

    // Process order status updates
    const statusUpdate = recentNotifications.find((n) =>
      ["OrderStatusUpdated", "Order Accepted", "DriverAssigned"].includes(
        n.eventType
      )
    );

    if (statusUpdate && statusUpdate.data) {
      console.log("Found status update:", statusUpdate);

      try {
        const eventData = statusUpdate.data;

        if (eventData.orderId) {
          // Map status if needed
          let status = eventData.data?.status || "unknown";

          // Normalize status names
          if (status === "AWAITING_PICKUP") status = "DRIVER_PICKUP";
          else if (status === "IN_PROGRESS") status = "IN_TRANSIT";

          setOrderStatus({
            orderId: eventData.orderId,
            status: status,
            timestamp: new Date(statusUpdate.timestamp).getTime(),
            estimatedArrival: eventData.data?.estimatedArrival,
            message: eventData.data?.message || statusUpdate.message,
            driver: eventData.data?.driver,
          });

          console.log("Updated order status from standardized data:", status);
        }
      } catch (e) {
        console.error("Error processing order status data:", e);
      }
    }
  }, [notifications, isTracking, trackingOrderId]);

  // Auto-start tracking when an order is created
  useEffect(() => {
    if (orderId && !isTracking) {
      startTracking(orderId);
    }
  }, [orderId, isTracking]);

  return (
    <TrackingContext.Provider
      value={{
        isTracking,
        driverLocation,
        orderStatus,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

// Create a hook to use the tracking context
export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
};
